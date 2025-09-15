package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ahmetcanc/TaskMan/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type BoardHandler struct {
	DB  *gorm.DB
	RDB *redis.Client
	Ctx context.Context
}

func NewBoardHandler(db *gorm.DB, rdb *redis.Client) *BoardHandler {
	return &BoardHandler{
		DB:  db,
		RDB: rdb,
		Ctx: context.Background(),
	}
}

// GET /boards
func (h *BoardHandler) GetBoards(c *gin.Context) {
	// JWT'den user ID'yi al
	userID := c.GetUint("user_id")

	// Cache key'ini user-specific yap
	cacheKey := fmt.Sprintf("boards_user_%d", userID)

	cached, err := h.RDB.Get(h.Ctx, cacheKey).Result()
	if err == nil && cached != "" {
		var boards []models.Board
		if err := json.Unmarshal([]byte(cached), &boards); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": boards, "source": "cache"})
			return
		}
	}

	var boards []models.Board
	// Sadece o kullanıcının board'larını getir
	if err := h.DB.Where("user_id = ?", userID).Preload("Tasks").Find(&boards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	data, _ := json.Marshal(boards)
	h.RDB.Set(h.Ctx, cacheKey, data, time.Hour)

	c.JSON(http.StatusOK, gin.H{"data": boards, "source": "db"})
}

// POST /boards
func (h *BoardHandler) CreateBoard(c *gin.Context) {
	// JWT'den user ID'yi al - frontend'den user_id göndermeye gerek yok
	userID := c.GetUint("user_id")

	var input struct {
		Title string `json:"title"`
		// UserID kaldırıldı - JWT'den alınıyor
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	board := models.Board{
		Title:  input.Title,
		UserID: userID, // JWT'den gelen user ID
	}

	if err := h.DB.Create(&board).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// User-specific cache'i temizle
	cacheKey := fmt.Sprintf("boards_user_%d", userID)
	h.RDB.Del(h.Ctx, cacheKey)

	c.JSON(http.StatusCreated, gin.H{"data": board})
}

// PUT /boards/:id
func (h *BoardHandler) UpdateBoard(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var board models.Board
	// Önce board'un kullanıcıya ait olup olmadığını kontrol et
	if err := h.DB.Where("id = ? AND user_id = ?", id, userID).First(&board).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found or access denied"})
		return
	}

	var input struct {
		Title string `json:"title"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	board.Title = input.Title

	if err := h.DB.Save(&board).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// User-specific cache'i temizle
	cacheKey := fmt.Sprintf("boards_user_%d", userID)
	h.RDB.Del(h.Ctx, cacheKey)

	c.JSON(http.StatusOK, gin.H{"data": board})
}

// DELETE /boards/:id
func (h *BoardHandler) DeleteBoard(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var board models.Board
	// Önce board'un kullanıcıya ait olup olmadığını kontrol et
	if err := h.DB.Where("id = ? AND user_id = ?", id, userID).First(&board).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found or access denied"})
		return
	}

	if err := h.DB.Delete(&board).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// User-specific cache'leri temizle
	cacheKey := fmt.Sprintf("boards_user_%d", userID)
	tasksCacheKey := fmt.Sprintf("tasks_user_%d", userID)
	h.RDB.Del(h.Ctx, cacheKey)
	h.RDB.Del(h.Ctx, tasksCacheKey) // board silindi → o board'a ait tasks da değişti

	c.JSON(http.StatusOK, gin.H{"message": "Board deleted"})
}
