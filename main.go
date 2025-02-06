package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"sync"

	"forum/api"
	"forum/handlers"
	"forum/middleware"
	"forum/router"

	_ "github.com/mattn/go-sqlite3"
)

var UsersLimiters sync.Map

func main() {
	port := ":8000"
	db, db_err := sql.Open("sqlite3", "./forum.db")
	if db_err != nil {
		log.Fatal(db_err.Error())
	}

	mainMux := http.NewServeMux()
	mainMux.Handle("/api/", router.APIRouter(db))
	mainMux.Handle("/", router.WebRouter())
	mainMux.HandleFunc("/ws", handlers.Test)

	go api.Hub.Run()
	go api.Hub.PingService()
	go middleware.CleanupLimiters()

	fmt.Printf("Server running in 'http://localhost%s'\n", port)
	if err := http.ListenAndServe(port, mainMux); err != nil {
		log.Fatal(err)
	}
}
