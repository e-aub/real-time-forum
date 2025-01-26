package models

type User struct {
	Id        int    `json:"id"`
	Nickname  string `json:"nickname"`
	Age       string `json:"age"`
	Gender    string `json:"gender"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Password2 string `json:"password2"`
}
