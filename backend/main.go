package main

import (
	"time"

	"github.com/ahmetcanc/TaskMan/internal/cache"
	"github.com/ahmetcanc/TaskMan/internal/db"
	"github.com/ahmetcanc/TaskMan/internal/handlers"
	"github.com/ahmetcanc/TaskMan/internal/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Frontend portun
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

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
