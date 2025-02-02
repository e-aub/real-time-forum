package router

import (
	"database/sql"
	"net/http"

	"forum/api"
	"forum/handlers"
	"forum/middleware"
)

func APIRouter(db *sql.DB) *http.ServeMux {
	router := http.NewServeMux()
	router.HandleFunc("POST /api/register", func(w http.ResponseWriter, r *http.Request) {
		api.Register(w, r, db)
	})

	router.HandleFunc("POST /api/login", func(w http.ResponseWriter, r *http.Request) {
		api.Login(w, r, db)
	})

	// router.HandleFunc("POST /api/logout", func(w http.ResponseWriter, r *http.Request) {
	// 	api.Logout(w, r, db)
	// })

	router.HandleFunc("GET /api/posts", middleware.Middleware(db, handlers.GetPosts))
	router.HandleFunc("POST /api/create_post", middleware.Middleware(db, handlers.CreatePostHandler))
	router.Handle("GET /api/authenticated", middleware.Middleware(db, handlers.UserDataHandler))
	return router
}
