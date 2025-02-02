package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"forum/utils"
	"net/http"
	"os"
	"strings"
)

type Post struct {
	Categories []string `json:"categories"`
	Content    string   `json:"content"`
	CreatedAt  string   `json:"created_at"`
	UserName   string   `json:"user_name"`
	PostId     int      `json:"post_id"`
}

var Categories = []string{"funny", "entertainment", "help", "science", "random"}

func CreatePostHandler(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	var post Post
	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		utils.JsonErr(w, http.StatusBadRequest, http.StatusText(http.StatusBadRequest))
		fmt.Fprintln(os.Stderr, err)
		return
	}

	if err := validatePost(post); err != nil {
		utils.JsonErr(w, http.StatusBadRequest, err.Error())
		return
	}

	_, err := db.Exec("INSERT INTO posts (user_id, categories, content) VALUES (?, ?, ?)", userId, strings.Join(post.Categories, "|"), post.Content)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func validatePost(post Post) error {
	if len(post.Content) < 1 || len(post.Content) > 1000 {
		return errors.New("post content must be between 1 and 1000 characters")
	} else if len(post.Categories) > 5 || len(post.Categories) < 1 {
		return errors.New("post categories must be between 1 and 5")
	} else if !isValidCategories(post.Categories) {
		return errors.New("invalid categories")
	}
	return nil
}

func isValidCategories(categories []string) bool {
	for _, category := range categories {
		if !utils.Contains(categories, category) {
			return false
		}
	}
	return true
}
