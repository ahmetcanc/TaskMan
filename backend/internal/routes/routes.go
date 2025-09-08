package routes

import (
	"github.com/ahmetcanc/TaskMan/internal/handlers"
	"github.com/ahmetcanc/TaskMan/internal/middleware"
	"github.com/gin-gonic/gin"
)

// SetupRoutes tüm endpointleri ayarlar ve router döndürür
func SetupRoutes(
	r *gin.Engine,
	userHandler *handlers.UserHandler,
	boardHandler *handlers.BoardHandler,
	taskHandler *handlers.TaskHandler,
) {

	// Public endpoints
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.POST("/login", userHandler.Login)
	r.POST("/register", userHandler.CreateUser)

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
		protected.GET("/tasks/:id", taskHandler.GetTaskByID)
		protected.POST("/tasks", taskHandler.CreateTask)
		protected.PUT("/tasks/:id", taskHandler.UpdateTask)
		protected.DELETE("/tasks/:id", taskHandler.DeleteTask)

		// User endpoints
		protected.GET("/users", userHandler.GetUsers)
		protected.PUT("/users/:id", userHandler.UpdateUser)
		protected.DELETE("/users/:id", userHandler.DeleteUser)
	}
}
