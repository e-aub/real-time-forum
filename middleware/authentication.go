package middleware

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	"forum/utils"
)

type CostomHandlFunc func(w http.ResponseWriter, r *http.Request, db *sql.DB)

func Auth(next CostomHandlFunc, db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token, token_err := r.Cookie("token")
		if token_err != nil {
			fmt.Fprintln(os.Stderr, token_err.Error())
			utils.JsonErr(w, http.StatusUnauthorized, http.StatusText(http.StatusUnauthorized))
			return
		}
		if _, err := CheckToken(token.Value, db); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			utils.JsonErr(w, http.StatusUnauthorized, http.StatusText(http.StatusUnauthorized))
			return
		}
		next(w, r, db)
	}
}

func CheckToken(token string, db *sql.DB) (int, error) {
	var user_id int
	query := `SELECT user_id FROM sessions WHERE token = ?;`
	if err := db.QueryRow(query, &token).Scan(&user_id); err != nil {
		return 0, err
	}
	return user_id, nil
}
