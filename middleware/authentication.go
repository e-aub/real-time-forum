package middleware

import (
	"database/sql"
	"net/http"
	"time"
)

type customHandler func(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int)

func Middleware(db *sql.DB, next customHandler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("token")
		token := cookie.Value
		if err != nil || token == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		var userId int
		var expires_at time.Time
		err = db.QueryRow("SELECT user_id, created_at FROM sessions WHERE token=?", token).Scan(&userId, &expires_at)

		if err == sql.ErrNoRows {
			w.WriteHeader(http.StatusUnauthorized)
			return
		} else if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if time.Now().After(expires_at) {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		next(w, r, db, userId)
	})

}
