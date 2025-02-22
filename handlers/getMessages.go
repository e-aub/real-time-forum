package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"forum/utils"
)

type Message struct {
	Id         int `json:"id"`
	SenderId   int
	ReceiverId int
	Sender     string `json:"sender"`
	Receiver   string `json:"receiver"`
	Message    string `json:"message"`
	CreatedAt  string `json:"creation_date"`
}

type resp struct {
	Messages []Message `json:"messages"`
	Offset   int       `json:"offset"`
}

func GetMessages(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	opponentUsername := r.URL.Query().Get("opponnent")
	opponnentId, err := utils.GetUserId(db, opponentUsername)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.JsonErr(w, http.StatusBadRequest, "invalid opponent username!")
			return
		}
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	offset, err := strconv.Atoi(r.URL.Query().Get("offset"))

	if err != nil || offset <= 0 {
		query := `SELECT COALESCE(
            (SELECT MAX(id) FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (receiver_id = $1 AND sender_id = $2)), 
            0
        );`

		err := db.QueryRow(query, userId, opponnentId).Scan(&offset)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			if err == sql.ErrNoRows {
				utils.JsonErr(w, http.StatusBadRequest, "invalid opponent username!")
				return
			}
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
			return
		}
	}
	query := `SELECT m.id, u.nickname, m.sender_id, m.receiver_id, u.firstname, u.lastname, m.content, m.created_at 
	FROM messages m
	JOIN users u ON m.sender_id = u.id
	WHERE ((m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)) 
	AND m.id < $3
	ORDER BY m.id DESC 
	LIMIT 10;`

	rows, err := db.Query(query, userId, opponnentId, offset+1)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	defer rows.Close()
	var messages []Message
	for rows.Next() {
		var message Message
		var senderFirstName string
		var senderLastName string
		if err := rows.Scan(&message.Id, &message.Sender, &message.SenderId, &message.ReceiverId, &senderFirstName, &senderLastName, &message.Message, &message.CreatedAt); err != nil {
			fmt.Fprintln(os.Stderr, err)
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
			return
		}
		messages = append(messages, message)
	}
	if len(messages) == 0 {
		offset = -1
	} else {
		offset = messages[len(messages)-1].Id
	}
	utils.RespondWithJson(w, http.StatusOK, resp{Messages: messages, Offset: offset})
}
