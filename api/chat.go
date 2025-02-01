package api

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	"forum/utils"

	"github.com/gorilla/websocket"
)

/*
	- [conn, sender, receiver, message, creation_date, type]
*/

type Client struct {
	Conn     *websocket.Conn
	Username string
}

type Status struct {
	Online  string
	Offline string
}

type Req[T Message | Status] struct {
	Type    string
	Payload T
}

type Message struct {
	Type         string
	Sender       string
	Receiver     string
	Message      string
	CreationDate string
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}
var clients []Client

func HandleConn(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return
	}
	client := Client{Conn: conn, Username: "Anonymous"}
	fmt.Println(conn.RemoteAddr().String())
	clients = append(clients, client)
	go privateChat(w, conn, db, userId)
}

func privateChat(w http.ResponseWriter, conn *websocket.Conn, db *sql.DB, userId int) {
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
					utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
					break
				} else if len(message.Message) >= 500 {
					utils.JsonErr(w, http.StatusBadRequest, "message length to much")
					break
				} else if len(message.Message) < 1 {
					utils.JsonErr(w, http.StatusBadRequest, "message is empty")
					break
				}
				if err = CreateMessage(message, db, userId); err != nil {
					if err == sql.ErrNoRows {
						utils.JsonErr(w, http.StatusBadRequest, "invalid receiver name")
						break
					}
					utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
					break
				}
				break
			}
		}
		if !receiverOnline {
			if err = CreateMessage(message, db, userId); err != nil {
				if err == sql.ErrNoRows {
					utils.JsonErr(w, http.StatusBadRequest, "invalid receiver name")
					continue
				}
				utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
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
