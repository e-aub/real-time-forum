package api

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

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
var clients []Client

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
	fmt.Println(conn.RemoteAddr().String())
	clients = append(clients, client)
	go privateChat(conn, db, userId)
}

func getUsername(db *sql.DB, userId int) (string, error) {
	var username string
	query := `SELECT nickname FROM users WHERE id = ?;`
	err := db.QueryRow(query, &userId).Scan(&username)
	return username, err
}

func privateChat(conn *websocket.Conn, db *sql.DB, userId int) {
	var message Message
	defer conn.Close()
	for {
		err := conn.ReadJSON(&message)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			break
		}
		receiverOnline := false
		for _, client := range clients {
			if client.Username == message.Receiver {
				receiverOnline = true
				if err = client.Conn.WriteJSON(message); err != nil {
					fmt.Fprintln(os.Stderr, http.StatusText(http.StatusInternalServerError))
					// utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
					break
				} else if len(message.Message) >= 500 {
					fmt.Fprintln(os.Stderr, "message length to much")
					// utils.JsonErr(w, http.StatusBadRequest, "message length to much")
					break
				} else if len(message.Message) < 1 {
					fmt.Fprintln(os.Stderr, "message is empty")
					// utils.JsonErr(w, http.StatusBadRequest, "message is empty")
					break
				}
				if err = CreateMessage(message, db, userId); err != nil {
					if err == sql.ErrNoRows {
						fmt.Fprintln(os.Stderr, "invalid receiver name")
						// utils.JsonErr(w, http.StatusBadRequest, "invalid receiver name")
						break
					}
					fmt.Fprintln(os.Stderr, http.StatusText(http.StatusInternalServerError))
					// utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
					break
				}
				break
			}
		}
		if !receiverOnline {
			if err = CreateMessage(message, db, userId); err != nil {
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
	fmt.Printf("%s close the chat!\n", conn.RemoteAddr().String())
}

/*
#---------- CreateMessage ----------#
- get receiverId
- validate message data
- (add message to database and return nil) or (return err)
#-----------------------------------#
*/
func CreateMessage(msg Message, db *sql.DB, senderId int) error {
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
