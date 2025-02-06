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
	Broadcast  chan any
	Private    chan Message
}

type Client struct {
	Conns    []*websocket.Conn
	UserId   int
	Username string
}

func (h *HubType) Run() {
	for {
		select {
		case client := <-h.Register:
			h.RegisterClient(client)
		case client := <-h.Unregister:
			fmt.Println("unregister, username:", client.Username)
			h.UnregisterClient(client)
		case message := <-h.Broadcast:
			h.BroadcastMessage(message)
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
				if err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(time.Second*20)); err != nil {
					fmt.Fprintln(os.Stderr, err)
					Hub.Unregister <- client
				}
			}
		}
		h.Mu.Unlock()
	}
}

func (h *HubType) RegisterClient(client Client) {
	h.Mu.Lock()
	if cl, ok := h.Clients[client.Username]; ok {
		if len(cl.Conns) < 3 {
			cl.Conns = append(cl.Conns, client.Conns...)
		} else {
			cl.Conns = append(cl.Conns[1:], client.Conns...)
		}
		h.Clients[client.Username] = cl
	} else {
		h.Clients[client.Username] = client
	}

	client.Conns[len(client.Conns)-1].SetReadDeadline(time.Now().Add(time.Second * 20))

	client.Conns[len(client.Conns)-1].SetPongHandler(func(appData string) error {
		return client.Conns[len(client.Conns)-1].SetReadDeadline(time.Now().Add(time.Second * 20))
	})

	h.Mu.Unlock()
}

func (h *HubType) UnregisterClient(client Client) {
	h.Mu.Lock()
	cl := h.Clients[client.Username]
	if len(cl.Conns) <= 1 {
		cl.Conns[0].Close()
		delete(h.Clients, client.Username)
		h.Mu.Unlock()
		h.Broadcast <- Status{
			Type:     "status",
			UserName: client.Username,
			Online:   false,
		}
		return
	}
	for i, c := range cl.Conns {
		if c == client.Conns[0] {
			// c.Close()
			cl.Conns = append(cl.Conns[:i], cl.Conns[i+1:]...)
		}
	}
	h.Clients[client.Username] = cl
	h.Mu.Unlock()
}

func (h *HubType) SendPrivateMessage(message Message) {
	fmt.Println(message)
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

func (h *HubType) BroadcastMessage(message any) {
	h.Mu.Lock()
	for _, client := range h.Clients {
		for _, conn := range client.Conns {
			if err := conn.WriteJSON(message); err != nil {
				fmt.Fprintln(os.Stderr, err)
			}
		}
	}
	h.Mu.Unlock()
}

type BaseMessage struct {
	Type string `json:"type"`
}

/*---------- user conn type ----------*/

/*---------- status tracking type ----------*/
type Status struct {
	Type     string `json:"type"`
	UserName string `json:"user_name"`
	Online   bool   `json:"online"`
}

/*---------- request websocket types ----------*/
type Req[T Message | Status | WSError] struct {
	Type    string `json:"type"`
	Payload T      `json:"payload"`
}

/*---------- handle users status ----------*/
type WSError struct {
	Type    string
	Status  int
	Message string
}

/*---------- messages type ----------*/
type Message struct {
	Sender       string
	Receiver     string `json:"receiver"`
	Message      string `json:"message"`
	CreationDate string `json:"creation_date"`
}

/*---------- upgrade connection from http to ws ----------*/
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

/*---------- all users connection ----------*/
// var clients []Client

/*
#---------- HandleConn ----------#
- handle connection.
- save user connection.
#--------------------------------#
*/

var Hub = HubType{
	Clients:    make(map[string]Client),
	Register:   make(chan Client),
	Unregister: make(chan Client),
	Broadcast:  make(chan any),
	Private:    make(chan Message),
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
	Hub.Register <- Client{Conns: []*websocket.Conn{conn}, Username: username}
	go handleConn(conn, db, userId)
}

func getUsername(db *sql.DB, userId int) (string, error) {
	var username string
	query := `SELECT nickname FROM users WHERE id = ?;`
	err := db.QueryRow(query, &userId).Scan(&username)
	return username, err
}

func handleConn(conn *websocket.Conn, db *sql.DB, userId int) {
	fmt.Println("Connected:", conn.RemoteAddr())
	for {
		var message Message
		if err := conn.ReadJSON(&message); err != nil {
			Hub.Unregister <- Client{Conns: []*websocket.Conn{conn}, Username: message.Sender}
			fmt.Fprintln(os.Stderr, err)
			break
		}
		message.Sender, _ = getUsername(db, userId)
		if message.Receiver != "" {
			Hub.Private <- message
		}
	}
}

// 		receiverOnline := false
// 		for _, client := range clients {
// 			if client.Username == req.Payload.Receiver {
// 				receiverOnline = true
// 				if err = client.Conn.WriteJSON(req); err != nil {
// 					fmt.Fprintln(os.Stderr, http.StatusText(http.StatusInternalServerError))
// 					// utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
// 					break
// 				} else if len(req.Payload.Message) >= 500 {
// 					fmt.Fprintln(os.Stderr, "message length to much")
// 					// utils.JsonErr(w, http.StatusBadRequest, "message length to much")
// 					break
// 				} else if len(req.Payload.Message) < 1 {
// 					fmt.Fprintln(os.Stderr, "message is empty")
// 					// utils.JsonErr(w, http.StatusBadRequest, "message is empty")
// 					break
// 				}
// 				if err = SaveMessage(req.Payload, db, userId); err != nil {
// 					if err == sql.ErrNoRows {
// 						fmt.Fprintln(os.Stderr, "invalid receiver name")
// 						// utils.JsonErr(w, http.StatusBadRequest, "invalid receiver name")
// 						break
// 					}
// 					fmt.Fprintln(os.Stderr, http.StatusText(http.StatusInternalServerError))
// 					// utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
// 					break
// 				}
// 				break
// 			}
// 		}
// 		if !receiverOnline {
// 			if err = SaveMessage(req.Payload, db, userId); err != nil {
// 				if err == sql.ErrNoRows {
// 					fmt.Fprintln(os.Stderr, "invalid receiver name")
// 					// utils.JsonErr(w, http.StatusBadRequest, "invalid receiver name")
// 					continue
// 				}
// 				fmt.Fprintln(os.Stderr, http.StatusText(http.StatusInternalServerError))
// 				// utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
// 				continue
// 			}
// 		}

// 	}
// 	fmt.Printf("%s close the chat!\n", conn.RemoteAddr().String())
// }

// func WriteMessage(client Client, msg string) {}

// /*
// #---------- CreateMessage ----------#
// - get receiverId
// - validate message data
// - (add message to database and return nil) or (return err)
// #-----------------------------------#
// */
// func SaveMessage(msg Message, db *sql.DB, senderId int) error {
// 	/*---------- get receiverId ----------*/
// 	receiverId, err := getUserId(db, msg.Receiver)
// 	if err != nil {
// 		return err
// 	}
// 	/*---------- add message to database ----------*/
// 	query := `INSERT INTO messages(sender_id,receiver_id,content) VALUES(?,?,?);`
// 	_, err = db.Exec(query, &senderId, &receiverId, &msg.Message)
// 	return err
// }

// /*
// #---------- getUserId ----------#
// - return userId or error
// */
// func getUserId(db *sql.DB, username string) (int, error) {
// 	var id int
// 	query := `SELECT id FROM users WHERE (nickname = ?);`
// 	err := db.QueryRow(query, &username).Scan(&id)
// 	return id, err
// }
