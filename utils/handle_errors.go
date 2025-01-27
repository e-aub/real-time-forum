package utils

import (
	"encoding/json"
	"net/http"
)

func JsonErr(w http.ResponseWriter, code int, message string) {
	res := struct {
		Status  int
		Message string
	}{code, message}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(res)
}
