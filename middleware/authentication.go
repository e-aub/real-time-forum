package middleware

import (
	"database/sql"
	"fmt"
	"math"
	"net/http"
	"os"
	"sync"
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
		limiter = NewRateLimiter(userId, 5, 10, time.Second)
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
		if r.Bucket < r.Capacity {
			r.Bucket = int(math.Min(float64((r.Bucket + r.Rate)), float64(r.Capacity)))
		}
	}
	if r.Bucket > 0 {
		r.Bucket--
		return true
	}
	return false
}
