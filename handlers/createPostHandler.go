package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"forum/utils"
)

type Post struct {
	PostId     int      `json:"post_id"`
	Avatar     string   `json:"avatar"`
	FirstName  string   `json:"first_name"`
	LastName   string   `json:"last_name"`
	UserName   string   `json:"user_name"`
	Content    string   `json:"content"`
	Categories []string `json:"categories"`
	CreatedAt  string   `json:"created_at"`
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

	res, err := db.Exec("INSERT INTO posts (user_id, categories, content) VALUES (?, ?, ?)", userId, strings.Join(post.Categories, "|"), post.Content)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}

	postId, err := res.LastInsertId()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	utils.RespondWithJson(w, http.StatusCreated, map[string]int{"post_id": int(postId)})
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
	mp := make(map[string]bool)
	for _, category := range categories {
		if !utils.Contains(Categories, category) {
			return false
		}
		if ok := mp[category]; ok {
			return false
		}
		mp[category] = true
	}
	return true
}
