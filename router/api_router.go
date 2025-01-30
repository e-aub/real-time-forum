package router

import (
	"database/sql"
	"net/http"

	"forum/api"
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

	router.Handle("GET /api/test", middleware.Middleware(db, middleware.CustomHandler(func(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int) {
		w.Write([]byte("OK"))
	})))
	return router
}
