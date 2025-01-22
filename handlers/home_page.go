package handlers

import (
	"net/http"
	"text/template"
)

func HomePage(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("views/index.html")
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	if err = tmpl.Execute(w, nil); err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}
