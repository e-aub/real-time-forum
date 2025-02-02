package handlers

import (
	"database/sql"
	"fmt"
	"forum/utils"
	"net/http"
	"os"
	"strings"
)

type UserData struct {
	Nickname  string `json:"nickname"`
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
	Email     string `json:"email"`
	Avatar    string `json:"avatar_url"`
}

const imageApi = "https://avatar.iran.liara.run/username?username=%s+%s"

func UserDataHandler(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	var UserData UserData
	err := db.QueryRow(`SELECT email, nickname, firstname, lastname FROM users WHERE id = ?`, userId).Scan(&UserData.Email, &UserData.Nickname, &UserData.Firstname, &UserData.Lastname)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	UserData.Avatar = fmt.Sprintf(imageApi, strings.ReplaceAll(UserData.Firstname, " ", ""), strings.ReplaceAll(UserData.Firstname, " ", ""))
	utils.RespondWithJson(w, http.StatusOK, UserData)
}
