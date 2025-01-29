package middleware

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"time"
)

type customHandler func(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int)

func Middleware(db *sql.DB, next customHandler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("token")
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		token := cookie.Value
		var userId int
		var expiresAt time.Time
		err = db.QueryRow("SELECT user_id, expires_at FROM sessions WHERE token=?", token).Scan(&userId, &expiresAt)

		if err == sql.ErrNoRows {
			w.WriteHeader(http.StatusUnauthorized)
			return
		} else if err != nil {
			fmt.Fprintln(os.Stderr, err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if time.Now().After(expiresAt) {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		next(w, r, db, userId)
	})
}
