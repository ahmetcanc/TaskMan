package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
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

// GET /tasks - Kullanıcının tüm task'ları
func (h *TaskHandler) GetTasks(c *gin.Context) {
	userID := c.GetUint("user_id")

	// User-specific cache
	cacheKey := fmt.Sprintf("tasks_user_%d", userID)
	cached, err := h.RDB.Get(h.Ctx, cacheKey).Result()
	if err == nil && cached != "" {
		var tasks []models.Task
		if err := json.Unmarshal([]byte(cached), &tasks); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": tasks, "source": "cache"})
			return
		}
	}

	var tasks []models.Task
	// Task'ları board üzerinden user'a göre filtrele
	if err := h.DB.Joins("JOIN boards ON tasks.board_id = boards.id").
		Where("boards.user_id = ?", userID).
		Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	data, _ := json.Marshal(tasks)
	h.RDB.Set(h.Ctx, cacheKey, data, time.Hour)

	c.JSON(http.StatusOK, gin.H{"data": tasks, "source": "db"})
}

// GET /tasks/:id - Tek task getir
func (h *TaskHandler) GetTaskByID(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var task models.Task
	// Task'ın kullanıcının board'una ait olup olmadığını kontrol et
	if err := h.DB.Joins("JOIN boards ON tasks.board_id = boards.id").
		Where("tasks.id = ? AND boards.user_id = ?", id, userID).
		First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found or access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": task})
}

// POST /tasks - Yeni task oluştur
func (h *TaskHandler) CreateTask(c *gin.Context) {
	userID := c.GetUint("user_id")

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

	// Board'un kullanıcıya ait olup olmadığını kontrol et
	var board models.Board
	if err := h.DB.Where("id = ? AND user_id = ?", input.BoardID, userID).First(&board).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Board not found or access denied"})
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

	// User-specific cache'leri temizle
	userBoardsCacheKey := fmt.Sprintf("boards_user_%d", userID)
	userTasksCacheKey := fmt.Sprintf("tasks_user_%d", userID)
	h.RDB.Del(h.Ctx, userBoardsCacheKey)
	h.RDB.Del(h.Ctx, userTasksCacheKey)

	c.JSON(http.StatusCreated, gin.H{"data": task})
}

// PUT /tasks/:id - Task güncelle
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	userID := c.GetUint("user_id")
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var task models.Task
	// Task'ın kullanıcının board'una ait olup olmadığını kontrol et
	if err := h.DB.Joins("JOIN boards ON tasks.board_id = boards.id").
		Where("tasks.id = ? AND boards.user_id = ?", id, userID).
		First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found or access denied"})
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

	// Eğer board_id değiştiriliyorsa, yeni board'un da kullanıcıya ait olduğunu kontrol et
	if input.BoardID != 0 && input.BoardID != task.BoardID {
		var newBoard models.Board
		if err := h.DB.Where("id = ? AND user_id = ?", input.BoardID, userID).First(&newBoard).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Target board not found or access denied"})
			return
		}
		task.BoardID = input.BoardID
	}

	// Task'ı güncelle
	task.Title = input.Title
	task.Description = input.Description
	task.Status = input.Status

	if err := h.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// User-specific cache'leri temizle
	userBoardsCacheKey := fmt.Sprintf("boards_user_%d", userID)
	userTasksCacheKey := fmt.Sprintf("tasks_user_%d", userID)
	h.RDB.Del(h.Ctx, userBoardsCacheKey)
	h.RDB.Del(h.Ctx, userTasksCacheKey)
	h.RDB.Del(h.Ctx, fmt.Sprintf("task_user_%d_%d", userID, id))

	c.JSON(http.StatusOK, gin.H{"data": task})
}

// DELETE /tasks/:id - Task sil
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var task models.Task
	// Task'ın kullanıcının board'una ait olup olmadığını kontrol et
	if err := h.DB.Joins("JOIN boards ON tasks.board_id = boards.id").
		Where("tasks.id = ? AND boards.user_id = ?", id, userID).
		First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found or access denied"})
		return
	}

	if err := h.DB.Delete(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// User-specific cache'leri temizle
	userBoardsCacheKey := fmt.Sprintf("boards_user_%d", userID)
	userTasksCacheKey := fmt.Sprintf("tasks_user_%d", userID)
	h.RDB.Del(h.Ctx, userBoardsCacheKey)
	h.RDB.Del(h.Ctx, userTasksCacheKey)
	h.RDB.Del(h.Ctx, fmt.Sprintf("task_user_%d_%s", userID, id))

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
}
