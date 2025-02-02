package handlers

import (
	"database/sql"
	"fmt"
	"forum/utils"
	"net/http"
	"os"
)

func Logout(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	_, err := db.Exec("DELETE FROM sessions WHERE user_id = ?", userId)
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
