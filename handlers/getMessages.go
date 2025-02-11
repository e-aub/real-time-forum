package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	"forum/utils"
)

type Message struct {
	SenderId   int
	ReceiverId int
	Sender     string `json:"sender"`
	Receiver   string `json:"receiver"`
	Message    string `json:"message"`
	CreatedAt  string `json:"creation_date"`
}

func GetMessages(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	offset := r.URL.Query().Get("offset")
	opponentUsername := r.URL.Query().Get("opponent-username")
	opponnentId, err := utils.GetUserId(db, opponentUsername)
	fmt.Println(err)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.JsonErr(w, http.StatusBadRequest, "invalid opponent username!")
			return
		}
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	if offset == "" {
		fmt.Println("sender", userId, "receiver", opponnentId)
		query := `SELECT MAX(id) FROM messages WHERE id IN (
			(SELECT MAX(id) FROM messages WHERE sender_id = $1 AND receiver_id = $2),
			(SELECT MAX(id) FROM messages WHERE receiver_id = $2 AND sender_id = $1)
		)`
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

	query := `SELECT sender_id, receiver_id, content, created_at 
	FROM messages 
	WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)) 
	AND id < $3 
	ORDER BY created_at DESC 
	LIMIT 10;`

	rows, err := db.Query(query, userId, opponnentId, offset)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	defer rows.Close()
	var messages []Message
	for rows.Next() {
		var message Message
		if err := rows.Scan(&message.SenderId, &message.ReceiverId, &message.Message, &message.CreatedAt); err != nil {
			fmt.Fprintln(os.Stderr, err)
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
			return
		}
		message.Sender, err = utils.GetUsername(db, message.SenderId)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
			return
		}
		message.Receiver, err = utils.GetUsername(db, message.ReceiverId)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
			return
		}
		messages = append(messages, message)
	}
	utils.RespondWithJson(w, http.StatusOK, messages)
}
