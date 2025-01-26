package router

import (
	"database/sql"
	"forum/api"
	"net/http"
)

type CostomHandler func(w http.ResponseWriter,r *http.Request, db *sql.DB)
func APIRouter(db *sql.DB) *http.ServeMux {
	router := http.NewServeMux()
	router.HandleFunc("/api/register", func(w http.ResponseWriter,r *http.Request) {
		api.Register(w,r,db)
	})
	router.HandleFunc("/api/login", api.Login)
	return router
}