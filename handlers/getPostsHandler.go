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
	if err != nil || offset <= 0 {
		utils.JsonErr(w, http.StatusBadRequest, "Invalid offset parameter")
		return
	}
	rows, err := db.Query(`
	SELECT posts.id, users.nickname, users.firstname, users.lastname, posts.content, posts.categories, posts.created_at
	FROM posts
	JOIN users ON posts.user_id = users.id
	WHERE posts.id <= ?
	ORDER BY posts.id DESC
	LIMIT ?`, offset, 10)

	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var post Post
		var categoriesStr string
		if err := rows.Scan(&post.PostId, &post.UserName, &post.FirstName, &post.LastName, &post.Content, &categoriesStr, &post.CreatedAt); err != nil {
			fmt.Fprintln(os.Stderr, err)
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
			return
		}

		post.Categories = strings.Split(categoriesStr, "|")
		post.Avatar = utils.CreateUserAvatar(post.FirstName, post.LastName)
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}

	utils.RespondWithJson(w, http.StatusOK, posts)
}
