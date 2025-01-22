package router

import "net/http"


func WebRouter() *http.ServeMux {
	router := http.NewServeMux()

	return router
}