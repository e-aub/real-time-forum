package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	"forum/api"
	"forum/utils"
)

func Logout(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	userName, err := utils.GetUsername(db, userId)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	api.Hub.Unregister <- api.Client{Username: userName}
	_, err = db.Exec("DELETE FROM sessions WHERE user_id = ?", userId)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		MaxAge:   -1,
		HttpOnly: true,
		Path:     "/",
	})
	w.WriteHeader(http.StatusNoContent)
}
