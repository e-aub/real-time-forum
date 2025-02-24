package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"sort"
	"strings"

	"forum/api"
	"forum/utils"
)

type User struct {
	Avatar        string `json:"avatar"`
	Nickname      string `json:"username"`
	FirstName     string `json:"firstname"`
	LastName      string `json:"lastname"`
	Online        bool   `json:"online"`
	Notify        bool   `json:"notify"`
	LastMessageId int
}

func GetUsers(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	query := `SELECT 
				COALESCE(
					(SELECT MAX(m.id) 
					FROM messages m 
					WHERE (sender_id = $1 AND receiver_id = u.id) 
						OR (receiver_id = $1 AND sender_id = u.id)
					), 
					0
				) AS max_message_id, 
				u.nickname, 
				u.firstname, 
				u.lastname, 
				COALESCE(
					(SELECT m2.seen 
					FROM messages m2 
					WHERE sender_id = u.id 
					AND receiver_id = $1 
					ORDER BY m2.id DESC 
					LIMIT 1
					), 
					true
				) AS notify
			FROM 
				users u
			WHERE 
				u.id != $1;

			`

	rows, err := db.Query(query, userId)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.LastMessageId, &user.Nickname, &user.FirstName, &user.LastName, &user.Notify); err != nil {
			fmt.Fprintln(os.Stderr, err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		user.Avatar = utils.CreateUserAvatar(user.FirstName, user.LastName)
		api.Hub.Mu.Lock()
		_, user.Online = api.Hub.Clients[user.Nickname]
		api.Hub.Mu.Unlock()
		user.Notify = !user.Notify
		users = append(users, user)
	}
	if len(users) > 0 {
		sort.Slice(users, func(i, j int) bool {
			if users[i].LastMessageId == 0 && users[j].LastMessageId == 0 {
				return strings.ToLower(users[i].FirstName+users[i].LastName) < strings.ToLower(users[j].FirstName+users[j].LastName)
			}
			return users[i].LastMessageId > users[j].LastMessageId
		})
	}
	utils.RespondWithJson(w, http.StatusOK, users)
}
