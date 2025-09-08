package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/ahmetcanc/TaskMan/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var jwtSecret = []byte("supersecretkey") // production için env variable yap

type UserHandler struct {
	DB  *gorm.DB
	RDB *redis.Client
	Ctx context.Context
}

func NewUserHandler(db *gorm.DB, rdb *redis.Client) *UserHandler {
	return &UserHandler{
		DB:  db,
		RDB: rdb,
		Ctx: context.Background(),
	}
}

// ------------------- READ -------------------
// GET /users
func (h *UserHandler) GetUsers(c *gin.Context) {
	// Önce cache kontrolü
	cached, err := h.RDB.Get(h.Ctx, "users").Result()
	if err == nil && cached != "" {
		var users []models.User
		if err := json.Unmarshal([]byte(cached), &users); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": users, "source": "cache"})
			return
		}
	}

	// Cache yoksa DB'den çek
	var users []models.User
	if err := h.DB.Preload("Boards").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// DB'den çekilen veriyi cache'e kaydet (1 saat)
	data, _ := json.Marshal(users)
	h.RDB.Set(h.Ctx, "users", data, time.Hour)

	c.JSON(http.StatusOK, gin.H{"data": users, "source": "db"})
}

// POST /users
func (h *UserHandler) CreateUser(c *gin.Context) {
	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Şifreyi hashle
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
	}

	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// Cache temizle
	h.RDB.Del(h.Ctx, "users")

	c.JSON(http.StatusCreated, gin.H{"data": user})
}

// PUT /users/:id
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := h.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	user.Name = input.Name
	user.Email = input.Email
	user.Password = input.Password

	if err := h.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// Cache temizle
	h.RDB.Del(h.Ctx, "users")

	c.JSON(http.StatusOK, gin.H{"data": user})
}

// DELETE /users/:id
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := h.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := h.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// Cache temizle
	h.RDB.Del(h.Ctx, "users")
	h.RDB.Del(h.Ctx, "boards") // user silindi → boards da etkilenebilir

	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

// ------------------- LOGIN -------------------
// POST /login
func (h *UserHandler) Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var user models.User
	if err := h.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// password kontrol
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// JWT token üret
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // 24 saat geçerli
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}
