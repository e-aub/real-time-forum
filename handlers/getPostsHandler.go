package handlers

import (
	"database/sql"
	"fmt"
	"forum/utils"
	"net/http"
	"os"
	"strconv"
	"strings"
)

func GetPosts(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
	var posts []Post
	offsetStr := r.URL.Query().Get("offset")
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		utils.JsonErr(w, http.StatusBadRequest, "Invalid offset parameter")
		return
	}
	rows, err := db.Query("SELECT posts.id, users.nickname, posts.content, posts.categories, posts.created_at FROM posts JOIN users ON posts.user_id = users.id LIMIT ? OFFSET ?", 10, offset)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var post Post
		var categoriesStr string
		if err := rows.Scan(&post.PostId, &post.UserName, &post.Content, &categoriesStr, &post.CreatedAt); err != nil {
			fmt.Fprintln(os.Stderr, err)
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
			return
		}

		post.Categories = strings.Split(categoriesStr, "|")
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}

	utils.RespondWithJson(w, http.StatusOK, posts)
}
