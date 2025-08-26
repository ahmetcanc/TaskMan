package main

import (
	"net/http"

	"github.com/ahmetcanc/TaskMan/internal/cache"
	"github.com/ahmetcanc/TaskMan/internal/db"
	"github.com/ahmetcanc/TaskMan/internal/handlers"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// DB bağlantısı
	database := db.Connect()

	// Örnek veri
	db.ExamData(database)

	// Redis bağlantısı
	rdb := cache.RedisConnect()

	// Board handler
	boardHandler := handlers.NewBoardHandler(database, rdb)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Yeni endpoint
	r.GET("/boards", boardHandler.GetBoards)

	r.Run(":8080")
}
