package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"forum/models"
	"net/http"
	"regexp"
	"slices"
	"strconv"
	"strings"
)

func Register(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var userData models.User
	if err := json.NewDecoder(r.Body).Decode(&userData); err != nil {
		fmt.Println(err)
		return
	}
	if !CheckName(userData.FirstName) {
		fmt.Println("invalid firstname!")
		return
	}
	if !CheckAge(userData.Age) {
		fmt.Println("invalid age!")
		return
	}
	if !CheckGender(userData.Gender) {
		fmt.Println("invalid gender!")
		return
	}
	if !CheckNickName(userData.Nickname) {
		fmt.Println("invalid nickname!")
		return
	}
	if !CheckPassword(userData.Password) || userData.Password != userData.Password2 {
		fmt.Println("invalid password!")
		return
	}

	fmt.Println(userData)
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
	re, err := regexp.Compile(`^[a-zA-Z1-9-_]{8,30}$`)
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

func RegisterUser(data models.User, db *sql.DB) {
	query := `INSERT INTO users(nickname,age,gender,firstname,lastname,email,password) VALUES(?,?,?,?,?,?,?);`
	stmt, err := db.Prepare(query); 
	if err != nil {
		fmt.Println(err)
		return
	}
	_, err = stmt.Exec(data.Nickname,data.Age,data.Gender,data.FirstName,data.LastName,data.Email,data.Password)
	if err != nil {
		fmt.Println(err)
		return
	}
}
