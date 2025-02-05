package api

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"sync"

	"github.com/gorilla/websocket"
)

/*
	- [conn, sender, receiver, message, creation_date, type]
*/

/*---------- user conn type ----------*/
type Client struct {
	Conn     *websocket.Conn
	Username string
}

/*---------- status tracking type ----------*/
type Status struct {
	Online  string `json:"online"`
	Offline string `json:"offline"`
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
	Sender       string `json:"sender"`
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
var (
	clients = map[string][]Client{}
	mu      sync.Mutex
)

// var clients sync.Map

/*
#---------- HandleConn ----------#
- handle connection.
- save user connection.
#--------------------------------#
*/
func HandleConn(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
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
	client := Client{Conn: conn, Username: username}
	mu.Lock()
	clients[username] = append(clients[username], client)
	mu.Unlock()
	go privateChat(conn, db, userId, username)
}

func getUsername(db *sql.DB, userId int) (string, error) {
	var username string
	query := `SELECT nickname FROM users WHERE id = ?;`
	err := db.QueryRow(query, &userId).Scan(&username)
	return username, err
}

func privateChat(conn *websocket.Conn, db *sql.DB, userId int, username string) {
	var req Req[Message]
	req.Type = `message`
	defer conn.Close()
	for {
		err := conn.ReadJSON(&req)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				fmt.Fprintln(os.Stderr, "Unexpected close error!")
			} else {
				fmt.Fprintln(os.Stderr, "Connection closed!")
			}
			removeConn(conn, username)
			fmt.Fprintln(os.Stderr, err)
			return
		}

		if len(req.Payload.Message) >= 500 || len(req.Payload.Message) < 1 {
			fmt.Fprintln(os.Stderr, "message length not valid!")
			writeError(conn, "message length should be between 1 and 500 characters!", 1009)
			continue // 
		}

		for _, client := range clients[req.Payload.Receiver] {
			if err = client.Conn.WriteJSON(req); err != nil {
				fmt.Fprintln(os.Stderr, http.StatusText(http.StatusInternalServerError))
				writeError(conn, "Error sending message.", 1011)
			}
		}

		if err = SaveMessage(req.Payload, db, userId); err != nil {
			if err == sql.ErrNoRows {
				fmt.Fprintln(os.Stderr, "invalid receiver name")
				// utils.JsonErr(w, http.StatusBadRequest, "invalid receiver name")
				continue
			}
			fmt.Fprintln(os.Stderr, http.StatusText(http.StatusInternalServerError))
			// utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
			continue
		}
	}
}

/*
#---------- removeConn ----------#
- remove connection from client connections
*/
func removeConn(conn *websocket.Conn, username string) {
	mu.Lock()
	defer mu.Unlock()
	var newClientArr []Client
	for _, client := range clients[username] {
		if client.Conn != conn {
			newClientArr = append(newClientArr, client)
		}
	}
	clients[username] = newClientArr
}

/*
#---------- writeError ----------#
- write websocket error
*/
func writeError(conn *websocket.Conn, msg string, code int) {
	var req Req[WSError]
	req.Type = `error`
	req.Payload.Message = msg
	req.Payload.Status = code
	if err := conn.WriteJSON(&req); err != nil {
		fmt.Fprintln(os.Stderr, http.StatusText(http.StatusInternalServerError))
	}
}

/*
#---------- CreateMessage ----------#
- get receiverId
- validate message data
- (add message to database and return nil) or (return err)
#-----------------------------------#
*/
func SaveMessage(msg Message, db *sql.DB, senderId int) error {
	/*---------- get receiverId ----------*/
	receiverId, err := getUserId(db, msg.Receiver)
	if err != nil {
		return err
	}
	/*---------- add message to database ----------*/
	query := `INSERT INTO messages(sender_id,receiver_id,content) VALUES(?,?,?);`
	_, err = db.Exec(query, &senderId, &receiverId, &msg.Message)
	return err
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
