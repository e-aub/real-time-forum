package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"forum/utils"
)

func UpdateSeen(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	messageId, err := strconv.Atoi(r.URL.Query().Get("message_id"))
	if err != nil {
		utils.JsonErr(w, http.StatusBadRequest, "Invalid message_id parameter")
		return
	}
	_, err = db.Exec("UPDATE messages SET seen = true WHERE id = ? AND receiver_id = ?", messageId, userId)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
