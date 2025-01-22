package router

import "net/http"


func APIRouter() *http.ServeMux {
	router := http.NewServeMux()
	return router
}