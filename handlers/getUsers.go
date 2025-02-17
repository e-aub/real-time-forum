package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	"forum/api"
	"forum/utils"
)

type User struct {
	Avatar    string `json:"avatar"`
	Nickname  string `json:"username"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Online    bool   `json:"online"`
}

func GetUsers(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	query := `SELECT nickname, firstname, lastname FROM users
				LEFT JOIN messages ON users.id = messages.sender_id OR users.id = messages.receiver_id
				WHERE users.id != ?
				GROUP BY users.id
				ORDER BY MAX(messages.created_at) DESC, users.nickname ASC;`

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
		if err := rows.Scan(&user.Nickname, &user.FirstName, &user.LastName); err != nil {
			fmt.Fprintln(os.Stderr, err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		user.Avatar = utils.CreateUserAvatar(user.FirstName, user.LastName)
		api.Hub.Mu.Lock()
		_, user.Online = api.Hub.Clients[user.Nickname]
		api.Hub.Mu.Unlock()
		users = append(users, user)
	}
	utils.RespondWithJson(w, http.StatusOK, users)
}
