package main

import (
	"fmt"
	"log"
	"net/http"

	"forum/router"
)

func main() {
	mainMux := http.NewServeMux()
	mainMux.Handle("/api/", router.APIRouter())
	mainMux.Handle("/", router.WebRouter())

	fmt.Println()
	if err := http.ListenAndServe(":8000", mainMux); err != nil {
		log.Fatal(err)
	}
}
