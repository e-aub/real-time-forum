package router

import (
	"net/http"

	"forum/handlers"
)

func WebRouter() *http.ServeMux {
	router := http.NewServeMux()
	router.HandleFunc("/static/", handlers.Static)
	router.HandleFunc("/", handlers.HomePage)

	return router
}
