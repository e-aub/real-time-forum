package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"forum/utils"
	"net/http"
	"os"
	"strings"
)

type Post struct {
	Categories []string `json:"categories"`
	Content    string   `json:"content"`
}

var Categories = []string{"funny", "cool", "help", "interesting", "random"}

func CreatePostHandler(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	var post Post
	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		utils.JsonErr(w, http.StatusBadRequest, http.StatusText(http.StatusBadRequest))
		fmt.Fprintln(os.Stderr, err)
		return
	}

	if !validatePost(post) {
		utils.JsonErr(w, http.StatusBadRequest, "Invalid post")
		return
	}

	_, err := db.Exec("INSERT INTO posts (user_id, categories, content) VALUES (?, ?, ?, ?)", userId, strings.Join(post.Categories, "|"), post.Content)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func validatePost(post Post) bool {
	if len(post.Content) < 1 || len(post.Content) > 1000 {
		return false
	} else if len(post.Categories) > 5 || len(post.Categories) < 1 {
		return false
	} else if !isValidCategories(post.Categories) {
		return false
	}
	return true
}

func isValidCategories(categories []string) bool {
	for _, category := range categories {
		if !utils.Contains(categories, category) {
			return false
		}
	}
	return true
}
