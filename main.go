package main

import (
	"fmt"
	"log"
	"net/http"

	"forum/router"
)

func main() {
	port := ":8000"
	mainMux := http.NewServeMux()
	mainMux.Handle("/api/", router.APIRouter())
	mainMux.Handle("/", router.WebRouter())

	fmt.Printf("Server running in 'http://localhost%s'", port)
	if err := http.ListenAndServe(port, mainMux); err != nil {
		log.Fatal(err)
	}
}
