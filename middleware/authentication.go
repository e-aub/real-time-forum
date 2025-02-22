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
	LastTime    time.Time
	Rate        int
	Capacity    int
	Bucket      int
	LimiterTime time.Duration
}

var UsersLimiters sync.Map

func CleanupLimiters(usersLimiters *sync.Map) {
	for {
		time.Sleep(time.Minute * 3)
		usersLimiters.Range(func(key, value interface{}) bool {
			limiter := value.(*RateLimiter)
			if time.Since(limiter.LastTime) >= time.Minute*3 {
				usersLimiters.Delete(key)
			}
			return true
		})
	}
}

func GetRateLimiter(userId int, usersLimiters *sync.Map) (bool, *RateLimiter) {
	limiter, ok := usersLimiters.Load(userId)
	if !ok {
		return false, nil
	}
	return true, limiter.(*RateLimiter)
}

func NewRateLimiter(userId, rate, capacity int, limiterTime time.Duration) *RateLimiter {
	return &RateLimiter{
		LastTime:    time.Now(),
		Rate:        rate,
		Capacity:    capacity,
		Bucket:      capacity,
		LimiterTime: limiterTime,
	}
}

func (r *RateLimiter) Allow() bool {
	if time.Since(r.LastTime) >= r.LimiterTime {
		duration := time.Since(r.LastTime).Seconds()
		r.LastTime = time.Now()
		r.Bucket = min(r.Bucket+(int(duration)*r.Rate), r.Capacity)
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

func Middleware(db *sql.DB, next CustomHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
			cookie := http.Cookie{
				Name:     "token",
				Value:    "",
				MaxAge:   -1,
				HttpOnly: true,
				Path:     "/",
			}
			http.SetCookie(w, &cookie)
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

		ok, limiter := GetRateLimiter(userId, &UsersLimiters)
		if !ok {
			limiter = NewRateLimiter(userId, 10, 20, time.Second)
			UsersLimiters.Store(userId, limiter)
		}
		if !limiter.Allow() {
			w.WriteHeader(http.StatusTooManyRequests)
			return
		}
		next(w, r, db, userId)
	}
}
