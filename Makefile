serve:
	@go run .

install:
	@go mod download

initdb:
	@sqlite3 forum.db < ./models/initdb.sql

pull:
	@git pull github 
	@git pull gitea main
	@git pull gitea yrahhaou

push:
	@git push github
	@git push gitea
	