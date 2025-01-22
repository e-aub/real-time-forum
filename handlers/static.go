package handlers

import (
	"net/http"
	"os"
	"strings"
)

func Static(w http.ResponseWriter, r *http.Request) {
	file, err := os.ReadFile("." + r.URL.Path)
	if err != nil {
		http.Error(w, "page not found", 404)
		return
	}

	if strings.HasSuffix(r.URL.Path, "css") {
		w.Header().Add("Content-Type", "text/css")
	} else if strings.HasSuffix(r.URL.Path, "js") {
		w.Header().Add("Content-Type", "text/javascript")
	}
	w.Write(file)
}
