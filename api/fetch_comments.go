package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"forum/models"
	"forum/utils"
)

func FetchComments(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	var cm models.Comment // comment
	w.Header().Add("Content-Type", "application/json")
	post_id, err := strconv.Atoi(r.PathValue("postId"))
	if err != nil {
		utils.JsonErr(w, http.StatusNotFound, http.StatusText(http.StatusNotFound))
		return
	}
	query := `SELECT user_id,post_id,content,created_at FROM comments WHERE post_id = ?;`
	if err := db.QueryRow(query, post_id).Scan(&cm.UserId, &cm.PostId, &cm.Content, &cm.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			utils.JsonErr(w, http.StatusNoContent, http.StatusText(http.StatusNoContent))
		} else {
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		}
		fmt.Fprintln(os.Stderr, err.Error())
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Header().Add("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(cm); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
}
