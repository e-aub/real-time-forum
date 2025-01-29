package handlers

import (
	"net/http"
	"os"
)


func HomePage(w http.ResponseWriter, r *http.Request) {
	content, err := os.ReadFile("views/index.html")
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	w.Header().Add("Content-Type", "text/html")
	w.Write(content)
}
