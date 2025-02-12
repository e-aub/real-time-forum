package api

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

/*
	- [conn, sender, receiver, message, creation_date, type]
*/

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

/*---------- status tracking type ----------*/
type Status struct {
	Type     string `json:"type"`
	UserName string `json:"user_name"`
	Online   bool   `json:"online"`
}

/*---------- handle users status ----------*/
type WSError[T ChatError | StatusErr] struct {
	Type    string
	ErrType string // could be chat error or online users error
	Error   T
}

type ChatError struct {
	Error                  string
	Status                 int
	ConversationByUsername string
}

type StatusErr struct {
	Error  string
	Status int
}

/*---------- messages type ----------*/
type Message struct {
	Type         string `json:"type"`
	Sender       string `json:"sender"`
	Receiver     string `json:"receiver"`
	Message      string `json:"content"`
	CreationDate string `json:"creation_date"`
	Avatar       string `json:"avatar"`
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

func (h *HubType) onlineDelayFunc(client *Client) bool {
	time.Sleep(time.Second * 5)
	h.Mu.Lock()
	defer h.Mu.Unlock()
	if _, ok := h.Clients[client.Username]; ok {
		return true
	}
	return false
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
				}, &client, h.onlineDelayFunc)
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
	// fmt.Println(message)
	h.Mu.Lock()
	to, ok := h.Clients[message.Receiver]
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
	fmt.Println("laaaa fin")
}

func Upgrade(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return
	}
	username, err := getUsername(db, userId)
	if err != nil {
		fmt.Fprintln(os.Stderr, "invalid username!")
		return
	}
	Hub.Register <- Client{Conns: []*websocket.Conn{conn}, Username: username, UserId: userId}
	go handleConn(conn, db, userId)
}

func getUsername(db *sql.DB, userId int) (string, error) {
	var username string
	query := `SELECT nickname FROM users WHERE id = ?;`
	err := db.QueryRow(query, &userId).Scan(&username)
	return username, err
}

func handleConn(conn *websocket.Conn, db *sql.DB, userId int) {
	conn.SetReadDeadline(time.Now().Add(time.Second * 30))

	conn.SetPongHandler(func(appData string) error {
		fmt.Println(appData)
		err := conn.SetReadDeadline(time.Now().Add(time.Second * 30))
		if err != nil {
			fmt.Println(err)
			return err
		}
		return nil
	})

	fmt.Println("Connected:", conn.RemoteAddr())
	userName, _ := getUsername(db, userId)
	for {
		var message Message
		if err := conn.ReadJSON(&message); err != nil {
			Hub.Unregister <- Client{Conns: []*websocket.Conn{conn}, Username: userName}
			fmt.Fprintln(os.Stderr, err)
			break
		}
		if message.Type == "message" {
			message.Sender, _ = getUsername(db, userId)
			if message.Receiver != "" && message.Message != "" {
				message.CreationDate = time.Now().Format("2006-01-02 15:04")
				if err := saveInDb(db, userId, message); err != nil {
					fmt.Fprintln(os.Stderr, err)
					break
				}
				Hub.Private <- message
			}
		} else if message.Type == "status" {
		}
	}
}

/*
#---------- getUserId ----------#
- return userId or error
*/
func getUserId(db *sql.DB, username string) (int, error) {
	var id int
	query := `SELECT id FROM users WHERE (nickname = ?);`
	err := db.QueryRow(query, &username).Scan(&id)
	return id, err
}

func saveInDb(db *sql.DB, senderId int, message Message) error {
	reciverId, err := getUserId(db, message.Receiver)
	if err != nil {
		return err
	}
	query := `INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?)`
	_, err = db.Exec(query, senderId, reciverId, message.Message, message.CreationDate)
	return err
}
