package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/ahmetcanc/TaskMan/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type TaskHandler struct {
	DB  *gorm.DB
	RDB *redis.Client
	Ctx context.Context
}

func NewTaskHandler(db *gorm.DB, rdb *redis.Client) *TaskHandler {
	return &TaskHandler{
		DB:  db,
		RDB: rdb,
		Ctx: context.Background(),
	}
}

// GET /tasks
func (h *TaskHandler) GetTasks(c *gin.Context) {
	cached, err := h.RDB.Get(h.Ctx, "tasks").Result()
	if err == nil && cached != "" {
		var tasks []models.Task
		if err := json.Unmarshal([]byte(cached), &tasks); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": tasks, "source": "cache"})
			return
		}
	}

	var tasks []models.Task
	if err := h.DB.Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	data, _ := json.Marshal(tasks)
	h.RDB.Set(h.Ctx, "tasks", data, time.Hour)

	c.JSON(http.StatusOK, gin.H{"data": tasks, "source": "db"})
}

// POST /tasks
func (h *TaskHandler) CreateTask(c *gin.Context) {
	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		BoardID     uint   `json:"board_id"`
		Status      string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Board var mı kontrol et
	var board models.Board
	if err := h.DB.First(&board, input.BoardID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Board not found"})
		return
	}

	task := models.Task{
		Title:       input.Title,
		Description: input.Description,
		Status:      input.Status,
		BoardID:     input.BoardID,
	}

	if err := h.DB.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	h.RDB.Del(h.Ctx, "tasks")
	c.JSON(http.StatusCreated, gin.H{"data": task})
}

// PUT /tasks/:id
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	id := c.Param("id")
	var task models.Task

	if err := h.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		BoardID     uint   `json:"board_id"`
		Status      string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Board var mı kontrol et
	var board models.Board
	if err := h.DB.First(&board, input.BoardID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Board not found"})
		return
	}

	task.Title = input.Title
	task.Description = input.Description
	task.Status = input.Status
	task.BoardID = input.BoardID

	if err := h.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	h.RDB.Del(h.Ctx, "tasks")
	c.JSON(http.StatusOK, gin.H{"data": task})
}

// DELETE /tasks/:id
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	id := c.Param("id")
	var task models.Task

	if err := h.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	if err := h.DB.Delete(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	h.RDB.Del(h.Ctx, "tasks")
	c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
}
