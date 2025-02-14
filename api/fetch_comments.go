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
	Id        int    `json:"id"`
	PostId    int    `json:"post_id"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Avatar    string `json:"avatar"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

type CommentsResponse struct {
	Comments []CommentType `json:"comments"`
	Offset   int           `json:"offset"`
}

func GetComments(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	var comments []CommentType
	postId, err := strconv.Atoi(r.URL.Query().Get("post_id"))
	if err != nil {
		utils.JsonErr(w, http.StatusBadRequest, "Invalid post_id parameter")
		return
	}
	offset, err := strconv.Atoi(r.URL.Query().Get("offset"))
	if err != nil || offset < 0 {
		query := `SELECT MAX(id) FROM comments WHERE post_id = ?`
		err := db.QueryRow(query, postId).Scan(&offset)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
			return
		}
		fmt.Println("offset:", offset)
	}
	rows, err := db.Query(`
	SELECT c.id, c.post_id, u.firstname, u.lastname, c.content, c.created_at
	FROM comments c
	JOIN users u ON c.user_id = u.id
	WHERE c.post_id = ? AND c.id < ?
	ORDER BY c.id DESC
	LIMIT ?`, postId, offset, 10)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, "Failed to fetch comments")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var comment CommentType
		if err := rows.Scan(&comment.Id, &comment.PostId, &comment.FirstName, &comment.LastName, &comment.Content, &comment.CreatedAt); err != nil {
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
	if len(comments) == 0 {
		utils.RespondWithJson(w, http.StatusOK, CommentsResponse{
			Offset: -1,
		})
		return
	}
	utils.RespondWithJson(w, http.StatusOK, CommentsResponse{
		Comments: comments,
		Offset:   comments[len(comments)-1].Id,
	})
}
