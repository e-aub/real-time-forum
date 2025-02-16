package utils

import (
	"database/sql"
	"fmt"
	"strings"
)

const imageApi = "https://avatar.iran.liara.run/username?username=%s+%s"

func Contains(slice []string, item string) bool { // you can use slices.Contains
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}

func CreateUserAvatar(firstName string, lastName string) string {
	return fmt.Sprintf(imageApi, strings.ReplaceAll(firstName, " ", ""), strings.ReplaceAll(lastName, " ", ""))
}

func GetUserId(db *sql.DB, username string) (int, error) {
	var id int
	query := `SELECT id FROM users WHERE (nickname = ?);`
	err := db.QueryRow(query, &username).Scan(&id)
	return id, err
}

func GetUsername(db *sql.DB, userId int) (string, error) {
	var username string
	query := `SELECT nickname FROM users WHERE id = ?;`
	err := db.QueryRow(query, &userId).Scan(&username)
	return username, err
}
