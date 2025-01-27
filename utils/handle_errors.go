package utils

import (
	"encoding/json"
	"net/http"
)

func JsonErr(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(struct {
		Message string `json:"message"`
	}{Message: message})
}
