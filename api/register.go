package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"regexp"
	"slices"
	"strconv"
	"strings"

	"forum/models"
	"forum/utils"

	"golang.org/x/crypto/bcrypt"
)

func Register(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var userData models.User
	var res struct {
		Status  int
		Message string
	}
	if err := json.NewDecoder(r.Body).Decode(&userData); err != nil {
		utils.JsonErr(w, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		return
	} else if !CheckName(userData.FirstName) {
		utils.JsonErr(w, http.StatusBadRequest, "invalid firstname!")
		return
	} else if !CheckName(userData.LastName) {
		utils.JsonErr(w, http.StatusBadRequest, "invalid lastname!")
		return
	} else if !CheckAge(userData.Age) {
		utils.JsonErr(w, http.StatusBadRequest, "invalid age!")
		return
	} else if !CheckGender(userData.Gender) {
		utils.JsonErr(w, http.StatusBadRequest, "invalid gender!")
		return
	} else if !CheckEmail(userData.Email) {
		utils.JsonErr(w, http.StatusBadRequest, "invalid email!")
		return
	} else if !CheckNickName(userData.Nickname) {
		utils.JsonErr(w, http.StatusBadRequest, "invalid nickname!")
		return
	} else if !CheckPassword(userData.Password) || userData.Password != userData.Password2 {
		utils.JsonErr(w, http.StatusBadRequest, "invalid password!")
		return
	}
	res.Status, res.Message = RegisterUser(userData, db)
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(res.Status)
	json.NewEncoder(w).Encode(res)
}

func CheckName(name string) bool {
	re, err := regexp.Compile(`^[a-zA-Z]{4,50}$`)
	if err != nil {
		return false
	}
	matched := re.MatchString(name)
	return matched
}

func CheckAge(age string) bool {
	ageNum, err := strconv.Atoi(age)
	if err != nil || ageNum < 14 || ageNum > 160 {
		return false
	}
	return true
}

func CheckGender(gender string) bool {
	gender = strings.ToLower(gender)
	genders := []string{"male", "female"}
	return slices.Contains(genders, gender)
}

func CheckNickName(nickname string) bool {
	re, err := regexp.Compile(`^[a-zA-Z1-9-_]{4,30}$`)
	if err != nil {
		return false
	}
	return re.MatchString(nickname)
}

func CheckEmail(email string) bool {
	re, err := regexp.Compile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$`)
	if err != nil || len(email) >= 255 {
		return false
	}
	return re.MatchString(email)
}

func CheckPassword(password string) bool {
	if len(password) < 8 || len(password) > 254 {
		return false
	}
	hasLower := false
	hasUpper := false
	hasDigit := false
	hasSpecial := false
	for _, char := range password {
		switch {
		case 'a' <= char && char <= 'z':
			hasLower = true
			continue
		case 'A' <= char && char <= 'Z':
			hasUpper = true
			continue
		case '0' <= char && char <= '9':
			hasDigit = true
			continue
		case strings.ContainsRune("!@#$%^&*()_+-=[]{}; ':\"\\|,.<>/?", char):
			hasSpecial = true
			continue
		}
		return false
	}
	return hasLower && hasUpper && hasDigit && hasSpecial
}

func RegisterUser(data models.User, db *sql.DB) (int, string) {
	password, err := bcrypt.GenerateFromPassword([]byte(data.Password), bcrypt.DefaultCost)
	if err != nil {
		return http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError)
	}
	query := `INSERT INTO users(nickname,age,gender,firstname,lastname,email,password) VALUES(?,?,?,?,?,?,?);`

	_, err = db.Exec(query, data.Nickname, data.Age, data.Gender, data.FirstName, data.LastName, data.Email, string(password))
	if err != nil {
		return http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError)
	}
	return http.StatusCreated, "user created successfully!"
}
