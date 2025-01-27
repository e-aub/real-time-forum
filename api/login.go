package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"forum/utils"

	"github.com/gofrs/uuid"
	"golang.org/x/crypto/bcrypt"
)

/*
	- check authentication info
	- generate token
	- create session
*/

func Login(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var userData struct {
		LoginName string `json:"login_name"` // nickname or password
		Password  string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&userData); err != nil {
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	var user_id int
	var hashed_pass string
	const query = `SELECT id,password FROM users WHERE email = ? OR nickname = ?`
	err := db.QueryRow(query, &userData.LoginName, &userData.LoginName).Scan(&user_id, &hashed_pass)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.JsonErr(w, http.StatusUnauthorized, "Invalid username or email")
		} else {
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		}
		return
	}

	pass_err := bcrypt.CompareHashAndPassword([]byte(hashed_pass), []byte(userData.Password))
	if pass_err != nil {
		utils.JsonErr(w, http.StatusUnauthorized, "Invalid password")
		return
	}
	if err = CreateSession(w, user_id, db); err != nil {
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}

	w.WriteHeader(http.StatusAccepted)
}

func CreateSession(w http.ResponseWriter, user_id int, db *sql.DB) error {
	uid, token_err := uuid.NewV4()
	if token_err != nil {
		return token_err
	}
	query := `INSERT
		INTO 
		sessions(user_id, token) 
		VALUES(?, ?) 
		ON CONFLICT(user_id) DO UPDATE SET token = EXCLUDED.token, 
		created_at = CURRENT_TIMESTAMP;`
	_, err := db.Exec(query, &user_id, &uid)
	if err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    uid.String(),
		MaxAge:   int(time.Hour.Seconds()) * 24,
		HttpOnly: true,
		Path:     "/",
	})
	return nil
}
