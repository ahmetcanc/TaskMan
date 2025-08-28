package main

import (
	"net/http"

	"github.com/ahmetcanc/TaskMan/internal/cache"
	"github.com/ahmetcanc/TaskMan/internal/db"
	"github.com/ahmetcanc/TaskMan/internal/handlers"
	"github.com/ahmetcanc/TaskMan/internal/middleware"
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

	// Handler’lar
	boardHandler := handlers.NewBoardHandler(database, rdb)
	taskHandler := handlers.NewTaskHandler(database, rdb)
	userHandler := handlers.NewUserHandler(database, rdb)

	// Public endpoints
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.POST("/login", userHandler.Login)
	r.POST("/users", userHandler.CreateUser)

	// JWT korumalı endpoints
	protected := r.Group("/")
	protected.Use(middleware.JWTAuthMiddleware())
	{
		// Board endpoints
		protected.GET("/boards", boardHandler.GetBoards)
		protected.POST("/boards", boardHandler.CreateBoard)
		protected.PUT("/boards/:id", boardHandler.UpdateBoard)
		protected.DELETE("/boards/:id", boardHandler.DeleteBoard)

		// Task endpoints
		protected.GET("/tasks", taskHandler.GetTasks)
		protected.POST("/tasks", taskHandler.CreateTask)
		protected.PUT("/tasks/:id", taskHandler.UpdateTask)
		protected.DELETE("/tasks/:id", taskHandler.DeleteTask)

		// User endpoints
		protected.GET("/users", userHandler.GetUsers)
		protected.PUT("/users/:id", userHandler.UpdateUser)
		protected.DELETE("/users/:id", userHandler.DeleteUser)
	}

	r.Run(":8080")
}
