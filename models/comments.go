package models

type Comment struct {
	Id      int    `json:"id"`
	UserId  int    `json:"user_id"`
	PostId  int    `json:"post_id"`
	Content string `json:"content"`
	Date    string `json:"date"`
}
