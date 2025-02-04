package utils

import (
	"fmt"
	"strings"
)

const imageApi = "https://avatar.iran.liara.run/username?username=%s+%s"

func Contains(slice []string, item string) bool {
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
