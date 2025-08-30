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
	cached, err := h.RDB.Get(h.Ctx, "boards").Result()
	if err == nil && cached != "" {
		var boards []models.Board
		if err := json.Unmarshal([]byte(cached), &boards); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": boards, "source": "cache"})
			return
		}
	}

	var boards []models.Board
	if err := h.DB.Preload("Tasks").Find(&boards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	data, _ := json.Marshal(boards)
	h.RDB.Set(h.Ctx, "boards", data, time.Hour)

	c.JSON(http.StatusOK, gin.H{"data": boards, "source": "db"})
}

// POST /boards
func (h *BoardHandler) CreateBoard(c *gin.Context) {
	var input struct {
		Title  string `json:"title"`
		UserID uint   `json:"user_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	board := models.Board{
		Title:  input.Title,
		UserID: input.UserID,
	}

	if err := h.DB.Create(&board).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// Cache temizle
	h.RDB.Del(h.Ctx, "boards")

	c.JSON(http.StatusCreated, gin.H{"data": board})
}

// PUT /boards/:id
func (h *BoardHandler) UpdateBoard(c *gin.Context) {
	id := c.Param("id")
	var board models.Board

	if err := h.DB.First(&board, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
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

	// Cache temizle
	h.RDB.Del(h.Ctx, "boards")

	c.JSON(http.StatusOK, gin.H{"data": board})
}

// DELETE /boards/:id
func (h *BoardHandler) DeleteBoard(c *gin.Context) {
	id := c.Param("id")
	var board models.Board

	if err := h.DB.First(&board, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}

	if err := h.DB.Delete(&board).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// Cache temizle
	h.RDB.Del(h.Ctx, "boards")
	h.RDB.Del(h.Ctx, "tasks") // board silindi → o board’a ait tasks da değişti

	c.JSON(http.StatusOK, gin.H{"message": "Board deleted"})
}
