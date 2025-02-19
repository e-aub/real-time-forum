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
	Notify    bool   `json:"notify"`
}

func GetUsers(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	query := `SELECT u.nickname, u.firstname, u.lastname, COALESCE(m.seen, true) AS notify 
FROM users u
LEFT JOIN messages ON u.id = messages.sender_id OR u.id = messages.receiver_id
LEFT JOIN messages m ON u.id = m.sender_id AND m.receiver_id = $1
AND m.id = (
    SELECT MAX(id) 
    FROM messages 
    WHERE (sender_id = $1 AND receiver_id = u.id) 
       OR (sender_id = u.id AND receiver_id = $1)
)
WHERE u.id != $1 
GROUP BY u.id
ORDER BY MAX(messages.id) DESC, u.nickname ASC;

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
		if err := rows.Scan(&user.Nickname, &user.FirstName, &user.LastName, &user.Notify); err != nil {
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
	utils.RespondWithJson(w, http.StatusOK, users)
}
