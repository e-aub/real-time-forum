package models

type Posts struct {
	Id int `json:"id"`
	UserId int `json:"user_id"`
	Title string `json:"title"`
	Content string `json:"content"`
	Date string `json:"date"`
	Categories string `json:"categories"`
}