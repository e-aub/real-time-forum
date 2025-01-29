package router

import (
	"database/sql"
	"net/http"

	"forum/api"
)

func APIRouter(db *sql.DB) *http.ServeMux {
	router := http.NewServeMux()
	router.HandleFunc("POST /api/register", func(w http.ResponseWriter, r *http.Request) {
		api.Register(w, r, db)
	})
	router.HandleFunc("POST /api/login", func(w http.ResponseWriter, r *http.Request) {
		api.Login(w, r, db)
	})

	router.HandleFunc("GET /api/userData", func(w http.ResponseWriter, r *http.Request) {
		// middleware.Middleware()
	})
	return router
}
