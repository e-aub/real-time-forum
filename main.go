package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"forum/api"
	"forum/middleware"
	"forum/router"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	port := "0.0.0.0:8080"
	db, db_err := sql.Open("sqlite3", "./forum.db")
	if db_err != nil {
		log.Fatal(db_err.Error())
	}

	_, err := db.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		log.Fatal(err)
	}

	mainMux := http.NewServeMux()
	mainMux.Handle("/api/", router.APIRouter(db))
	mainMux.Handle("/", router.WebRouter())

	go api.Hub.Run()
	go api.Hub.PingService()
	go middleware.CleanupLimiters(&middleware.UsersLimiters)
	go middleware.CleanupLimiters(&api.ChatUsersLimiters)

	fmt.Printf("Server running in 'http://%s'\n", port)
	if err := http.ListenAndServe(port, mainMux); err != nil {
		log.Fatal(err)
	}
}
