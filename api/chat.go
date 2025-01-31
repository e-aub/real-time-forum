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

type Message struct {
	Type         string
	Conn         *websocket.Conn
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

func HandleConn(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return
	}
	client := Client{Conn: conn, Username: "Anonymous"}
	fmt.Println(conn.RemoteAddr().String())
	clients = append(clients, client)
	go privateChat(conn)
}

func privateChat(conn *websocket.Conn) {
	var message Message
	defer conn.Close()
	for {
		err := conn.ReadJSON(&message)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			break
		}
		for _, client := range clients {
			if client.Conn != conn {
				if err = client.Conn.WriteJSON(message); err != nil {
					fmt.Fprintln(os.Stderr, err)
				}
			}
		}
		// fmt.Println(string(p))
	}
	fmt.Printf("%s close the chat!\n", conn.RemoteAddr().String())
}
