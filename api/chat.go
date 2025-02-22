package api

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"forum/utils"

	"github.com/gorilla/websocket"
)

type HubType struct {
	Clients    map[string]Client
	Mu         sync.RWMutex
	Register   chan Client
	Unregister chan Client
	Broadcast  chan Status
	Private    chan Message
}

type Client struct {
	Conns    []*websocket.Conn
	UserId   int
	Username string
}

type Status struct {
	Type     string `json:"type"`
	UserName string `json:"username"`
	Online   bool   `json:"online"`
}

type Message map[string]any

func (message Message) isValidPrivateMessage() bool {
	receiver, ok1 := message["receiver"].(string)
	_, ok2 := message["content"].(string)
	_, ok3 := message["id"].(float64)
	if !ok1 || !ok2 || !ok3 || receiver == "" {
		return false
	}
	return true
}

func (message Message) isValidTypingMessage() bool {
	receiver, ok1 := message["receiver"].(string)
	_, ok2 := message["is_typing"].(bool)
	if !ok1 || !ok2 || receiver == "" {
		return false
	}
	return true
}

func sendChatError(receiver string, conversation string, messageId float64) {
	err := Message{}
	err["type"] = "error"
	err["receiver"] = receiver
	err["conversation"] = conversation
	err["id"] = messageId
	Hub.Private <- err
}

/*---------- upgrade connection from http to ws ----------*/
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

var Hub = HubType{
	Clients:    make(map[string]Client, 1024),
	Register:   make(chan Client, 1024),
	Unregister: make(chan Client, 1024),
	Broadcast:  make(chan Status, 1024),
	Private:    make(chan Message, 1024),
}

func (h *HubType) offlineDelayFunc(client *Client) bool {
	time.Sleep(time.Second * 5)
	h.Mu.Lock()
	defer h.Mu.Unlock()
	if _, ok := h.Clients[client.Username]; ok {
		return false
	}
	return true
}

func (h *HubType) Run() {
	for {
		select {
		case client := <-h.Register:
			broadcast := h.RegisterClient(client)
			if broadcast {
				h.BroadcastMessage(Status{
					Type:     "status",
					UserName: client.Username,
					Online:   true,
				}, &client, nil)
			}

		case client := <-h.Unregister:
			h.UnregisterClient(client)
			h.BroadcastMessage(Status{
				Type:     "status",
				UserName: client.Username,
				Online:   false,
			}, &client, h.offlineDelayFunc)
		case message := <-h.Broadcast:
			h.BroadcastMessage(message, nil, nil)
		case message := <-h.Private:
			fmt.Println(message)
			h.SendPrivateMessage(message)
		}
	}
}

func (h *HubType) PingService() {
	ticker := time.NewTicker(time.Second * 20)
	defer ticker.Stop()

	for range ticker.C {
		h.Mu.Lock()
		for _, client := range h.Clients {
			for _, conn := range client.Conns {
				if err := conn.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
					fmt.Fprintln(os.Stderr, err)
					Hub.Unregister <- client
				}
			}
		}
		h.Mu.Unlock()
	}
}

func (h *HubType) RegisterClient(client Client) bool {
	h.Mu.Lock()
	defer h.Mu.Unlock()
	if cl, ok := h.Clients[client.Username]; ok {
		if len(cl.Conns) < 3 {
			cl.Conns = append(cl.Conns, client.Conns...)
		} else {
			cl.Conns = append(cl.Conns[1:], client.Conns...)
		}
		h.Clients[client.Username] = cl
	} else {
		h.Clients[client.Username] = client
		return true
	}
	return false
}

func (h *HubType) UnregisterClient(client Client) {
	h.Mu.Lock()
	defer h.Mu.Unlock()

	if len(client.Conns) == 0 {
		delete(h.Clients, client.Username)
		return
	}

	cl := h.Clients[client.Username]
	var updatedConns []*websocket.Conn
	for _, conn := range cl.Conns {
		if conn != client.Conns[0] {
			updatedConns = append(updatedConns, conn)
			continue
		}
		conn.Close()
	}

	if len(updatedConns) == 0 {
		delete(h.Clients, client.Username)
		return
	}
	cl.Conns = updatedConns
	h.Clients[client.Username] = cl
}

func (h *HubType) SendPrivateMessage(message Message) {
	h.Mu.Lock()
	receiver := message["receiver"].(string)
	to, ok := h.Clients[receiver]
	if !ok {
		h.Mu.Unlock()
		fmt.Fprintln(os.Stderr, "receiver not found")
		return
	}
	for _, conn := range to.Conns {
		if err := conn.WriteJSON(message); err != nil {
			fmt.Fprintln(os.Stderr, err)
		}
	}
	h.Mu.Unlock()
}

func (h *HubType) BroadcastMessage(message any, client *Client, delayFunc func(client *Client) bool) {
	broadcast := func() {
		h.Mu.Lock()
		defer h.Mu.Unlock()
		for _, client := range h.Clients {
			for _, conn := range client.Conns {
				if err := conn.WriteJSON(message); err != nil {
					fmt.Fprintln(os.Stderr, err)
				}
			}
		}
	}

	if delayFunc != nil {
		go func() {
			if delayFunc(client) {
				broadcast()
			}
		}()
	} else {
		broadcast()
	}
}

func Upgrade(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		utils.RespondWithJson(w, http.StatusInternalServerError, map[string]string{"error": "failed to upgrade connection"})
		fmt.Fprintln(os.Stderr, err)
		return
	}
	username, err := getUsername(db, userId)
	if err != nil {
		utils.RespondWithJson(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
		fmt.Fprintln(os.Stderr, "invalid username!")
		return
	}
	Hub.Register <- Client{Conns: []*websocket.Conn{conn}, Username: username, UserId: userId}
	go handleConn(conn, db, userId, username)
}

func getUsername(db *sql.DB, userId int) (string, error) {
	var username string
	query := `SELECT nickname FROM users WHERE id = ?;`
	err := db.QueryRow(query, &userId).Scan(&username)
	return username, err
}

func handleConn(conn *websocket.Conn, db *sql.DB, userId int, userName string) {
	err := conn.SetReadDeadline(time.Now().Add(time.Second * 30))
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		Hub.Unregister <- Client{Conns: nil, Username: userName}
		return
	}

	conn.SetPongHandler(func(appData string) error {
		conn.SetReadDeadline(time.Now().Add(time.Second * 30))
		return nil
	})

	for {
		var message Message
		if err := conn.ReadJSON(&message); err != nil {
			Hub.Unregister <- Client{Conns: []*websocket.Conn{conn}, Username: userName}
			fmt.Fprintln(os.Stderr, err)
			break
		}
		messageType, ok := message["type"].(string)
		if !ok {
			continue
		}
		if messageType == "message" {
			ok := message.isValidPrivateMessage()
			if !ok {
				continue
			}

			if len(message["content"].(string)) == 0 || len(message["content"].(string)) > 500 {
				sendChatError(userName, message["receiver"].(string), message["id"].(float64))
				continue
			}

			message["sender"] = userName
			message["creation_date"] = time.Now().Format("2006-01-02 15:04")
			id, err := saveInDb(db, userId, message)
			if err != nil {
				fmt.Fprintln(os.Stderr, err)
				sendChatError(userName, message["receiver"].(string), message["id"].(float64))
				continue
			}
			message["id"] = id
			Hub.Private <- message
		} else if messageType == "typing" {
			ok := message.isValidTypingMessage()
			if !ok {
				continue
			}
			sender, err := getUsername(db, userId)
			if err != nil {
				fmt.Fprintln(os.Stderr, err)
				continue
			}
			message["sender"] = sender
			Hub.Private <- message
		} else if messageType == "ping" {
			message["type"] = "pong"
			message["receiver"] = userName
			Hub.Private <- message
		}
	}
}

func getUserId(db *sql.DB, username string) (int, error) {
	var id int
	query := `SELECT id FROM users WHERE (nickname = ?);`
	err := db.QueryRow(query, &username).Scan(&id)
	return id, err
}

func saveInDb(db *sql.DB, senderId int, message Message) (int, error) {
	reciverId, err := getUserId(db, message["receiver"].(string))
	if err != nil {
		return 0, err
	}
	query := `INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?)`
	res, err := db.Exec(query, senderId, reciverId, message["content"].(string), message["creation_date"].(string))
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), err
}
