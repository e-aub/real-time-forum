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

func FetchPost(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		utils.JsonErr(w, http.StatusNotFound, http.StatusText(http.StatusNotFound))
		return
	}
	var post models.Posts
	fmt.Println(id)
	query := `SELECT id,user_id,content,categories,created_at FROM posts WHERE id = ?;`
	if err := db.QueryRow(query, id).Scan(&post.Id, &post.UserId, &post.Content, &post.Categories, &post.CreatedAt); err != nil {
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
	json.NewEncoder(w).Encode(post)
}
