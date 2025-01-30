package middleware

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"
)

type CustomHandler func(w http.ResponseWriter, r *http.Request, db *sql.DB, userId int)

type RateLimiter struct {
	LastTime time.Time
	Rate     int
	Capacity int
	Bucket   int
}

var UsersLimiters sync.Map

func GetRateLimiter(userId int) *RateLimiter {
	limiter, ok := UsersLimiters.Load(userId)
	if !ok {
		limiter = NewRateLimiter(userId, 10, 20, time.Second)
		UsersLimiters.Store(userId, limiter)
	}
	return limiter.(*RateLimiter)
}
func NewRateLimiter(userId, rate, capacity int, limiterTime time.Duration) *RateLimiter {
	return &RateLimiter{
		LastTime: time.Now(),
		Rate:     rate,
		Capacity: capacity,
		Bucket:   capacity,
	}
}

func (r *RateLimiter) Allow() bool {
	if time.Since(r.LastTime) >= time.Second {
		r.LastTime = time.Now()
		r.Bucket = min(r.Bucket+r.Rate, r.Capacity)
	}
	if r.Bucket > 0 {
		r.Bucket--
		return true
	}
	return false
}

func min(a int, b int) int {
	if a < b {
		return a
	}
	return b
}

func Middleware(db *sql.DB, next CustomHandler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("token")
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		token := cookie.Value
		var userId int
		var expiresAtStr string
		err = db.QueryRow("SELECT user_id, expires_at FROM sessions WHERE token=?", token).Scan(&userId, &expiresAtStr)

		if err == sql.ErrNoRows {
			w.WriteHeader(http.StatusUnauthorized)
			return
		} else if err != nil {
			fmt.Fprintln(os.Stderr, err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		expiresAt, err := time.Parse("2006-01-02 15:04:05.999999999Z07:00", expiresAtStr)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if time.Now().After(expiresAt) {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		limiter := GetRateLimiter(userId)
		if !limiter.Allow() {
			w.WriteHeader(http.StatusTooManyRequests)
			return
		}
		next(w, r, db, userId)
	})
}
