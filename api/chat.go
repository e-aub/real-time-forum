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

type Client struct {
	Conn     *websocket.Conn
	Username string
}

type Status struct {
	Online string
	Offline string
}

type Req[T Message | Status] struct {
	Type     string
	Payload  T
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
	go privateChat(conn, db)
}

func privateChat(conn *websocket.Conn, db *sql.DB) {
	var message Message
	defer conn.Close()
	for {
		err := conn.ReadJSON(&message)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			break
		}
		for _, client := range clients {
			if client.Username == message.Receiver {
				if err = client.Conn.WriteJSON(message); err != nil {
					fmt.Fprintln(os.Stderr, err)
					break
				}
				CreateMessage(message, db)
				break
			}
		}
		// fmt.Println(string(p))
	}
	fmt.Printf("%s close the chat!\n", conn.RemoteAddr().String())
}

func CreateMessage(message Message, db *sql.DB) {
	fmt.Println(message)
}
