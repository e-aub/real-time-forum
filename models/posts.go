package models

type Posts struct {
	Id     int `json:"id"`
	UserId int `json:"user_id"`
	// Title string `json:"title"`
	Content    string `json:"content"`
	Categories string `json:"categories"`
	CreatedAt  string `json:"created_at"`
}
