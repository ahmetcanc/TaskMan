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
	// Önce Redis cache kontrolü
	cached, err := h.RDB.Get(h.Ctx, "boards").Result()
	if err == nil && cached != "" {
		// Cache varsa JSON olarak dön
		var boards []models.Board
		if err := json.Unmarshal([]byte(cached), &boards); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": boards, "source": "cache"})
			return
		}
	}

	// Cache yoksa DB’den çek
	var boards []models.Board
	if err := h.DB.Preload("Tasks").Find(&boards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// Redis’e kaydet (TTL 1 saat)
	data, _ := json.Marshal(boards)
	h.RDB.Set(h.Ctx, "boards", data, time.Hour)

	c.JSON(http.StatusOK, gin.H{"data": boards, "source": "db"})
}
