package api

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"forum/utils"
)

// `SELECT user_id,post_id,content,created_at FROM comments WHERE post_id = ? LIMIT = 10 OFFSET = 10;`
type CommentType struct {
	PostId    int    `json:"post_id"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Avatar    string `json:"avatar"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

func GetComments(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	var comments []CommentType
	offsetStr := r.URL.Query().Get("offset")
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset <= 0 {
		utils.JsonErr(w, http.StatusBadRequest, "Invalid offset parameter")
		return
	}
	rows, err := db.Query(`
	SELECT c.post_id, u.firstname, u.lastname, c.content, c.created_at
	FROM comments c
	JOIN users u ON c.user_id = u.id
	WHERE c.id <= ?
	ORDER BY c.id DESC
	LIMIT ?`, offset, 10)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, "Failed to fetch comments")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var comment CommentType
		if err := rows.Scan(&comment.PostId, &comment.FirstName, &comment.LastName, &comment.Content, &comment.CreatedAt); err != nil {
			fmt.Fprintln(os.Stderr, err)
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
			return
		}

		comment.Avatar = utils.CreateUserAvatar(comment.FirstName, comment.LastName)
		comments = append(comments, comment)
	}

	if err := rows.Err(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}

	utils.RespondWithJson(w, http.StatusOK, comments)
}
