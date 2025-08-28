package main

import (
	"github.com/ahmetcanc/TaskMan/internal/cache"
	"github.com/ahmetcanc/TaskMan/internal/db"
	"github.com/ahmetcanc/TaskMan/internal/handlers"
	"github.com/ahmetcanc/TaskMan/internal/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// DB & Redis bağlantısı
	database := db.Connect()
	rdb := cache.RedisConnect()

	// Örnek veri
	db.ExamData(database)

	// Handler’lar
	boardHandler := handlers.NewBoardHandler(database, rdb)
	taskHandler := handlers.NewTaskHandler(database, rdb)
	userHandler := handlers.NewUserHandler(database, rdb)

	// Routes
	routes.SetupRoutes(r, userHandler, boardHandler, taskHandler)

	r.Run(":8080")
}
