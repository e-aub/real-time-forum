serve:
	@go run .

install:
	@go mod download

initdb:
	@sqlite3 forum.db < ./models/initdb.sql
	