package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
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

	query := `SELECT id,password FROM users WHERE email = ? OR nickname = ?`
	stmt, stmt_err := db.Prepare(query)
	if stmt_err != nil {
		fmt.Println("prepare error")
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}
	defer stmt.Close()
	var user_id int
	var hashed_pass string
	err := stmt.QueryRow(&userData.LoginName, &userData.LoginName).Scan(&user_id, &hashed_pass)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.JsonErr(w, http.StatusUnauthorized, "Invalid login credentials")
		} else {
			utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		}
		fmt.Println("get user error")
		return
	}
	
	pass_err := bcrypt.CompareHashAndPassword([]byte(hashed_pass), []byte(userData.Password))
	if pass_err != nil {
		utils.JsonErr(w, http.StatusUnauthorized, "Invalid login credentials")
		return
	}
	if err = CreateSession(w, user_id, db); err != nil {
		fmt.Println("session err")
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	}

	res := struct {
		Status  int    `json:"status"`
		Message string `json:"message"`
	}{http.StatusAccepted, http.StatusText(http.StatusAccepted)}

	w.WriteHeader(http.StatusAccepted)
	w.Header().Add("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
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
	stmt, stmt_err := db.Prepare(query)
	if stmt_err != nil {
		return stmt_err
	}
	defer stmt.Close()
	_, err := stmt.Exec(&user_id, &uid)
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
