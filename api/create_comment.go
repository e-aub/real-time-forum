package api

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"forum/models"
	"forum/utils"
)

/*
- check postId
- check content
*/

func CreateComment(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	var comment models.Comment
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		utils.JsonErr(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	comment.UserId = userId
	comment.CreatedAt = time.Now().Format(time.RFC3339)

	// check postId
	if err := CheckPostId(db, comment.PostId); err != nil {
		if err == sql.ErrNoRows {
			utils.JsonErr(w, http.StatusBadRequest, "Post does not exist")
			return
		}
		utils.JsonErr(w, http.StatusInternalServerError, "Failed to check post ID")
		return
	}

	if err := CheckCommentContent(comment.Content); err != nil {
		utils.JsonErr(w, http.StatusBadRequest, err.Error())
		return
	}

	query := `INSERT INTO comments (user_id, post_id, content, created_at) VALUES (?, ?, ?, ?)`
	res, err := db.Exec(query, comment.UserId, comment.PostId, comment.Content, comment.CreatedAt)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, "Failed to create comment")
		return
	}

	commentId, err := res.LastInsertId()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, "Failed to retrieve comment ID")
		return
	}

	comment.Id = int(commentId)
	utils.RespondWithJson(w, http.StatusCreated, comment)
}

func CheckPostId(db *sql.DB, postId int) error {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM posts WHERE id = ?);`
	err := db.QueryRow(query, postId).Scan(&exists)
	return err
}

func CheckCommentContent(content string) error {
	if len(content) == 0 {
		return errors.New("comment content cannot be empty")
	}
	if len(content) > 500 {
		return errors.New("comment content cannot exceed 500 characters")
	}
	return nil
}
