package handlers

import (
	"database/sql"
	"encoding/json"
	"forum/utils"
	"net/http"
)

func GetMaxPostId(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	var maxPostId int
	err := db.QueryRow("SELECT MAX(id) FROM posts").Scan(&maxPostId)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.JsonErr(w, http.StatusNotFound, "No posts found")
			return
		}
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	w.Header().Add("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"max_post_id": maxPostId})
}
