package db

import (
	"log"
	"time"

	"github.com/ahmetcanc/TaskMan/internal/models"
	"gorm.io/gorm"
)

func ExamData(database *gorm.DB) {

	// -----------------------------
	// Örnek User
	user := models.User{
		Name:     "Ahmet Can",
		Email:    "ahmet@example.com",
		Password: "123456",
	}

	if err := database.FirstOrCreate(&user, models.User{Email: user.Email}).Error; err != nil {
		log.Fatal("User insert error:", err)
	}

	// -----------------------------
	// Örnek Board
	board := models.Board{
		Title:  "Görev Listesi",
		UserID: user.ID,
	}

	if err := database.FirstOrCreate(&board, models.Board{Title: board.Title, UserID: user.ID}).Error; err != nil {
		log.Fatal("Board insert error:", err)
	}

	// -----------------------------
	// Örnek Tasks
	tasks := []models.Task{
		{
			Title:       "Proje Planı Hazırla",
			Description: "TaskMan API için proje planı hazırlayacak",
			Status:      "todo",
			BoardID:     board.ID,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			Title:       "DB Bağlantısı Test",
			Description: "GORM ile veritabanı bağlantısını test et",
			Status:      "in-progress",
			BoardID:     board.ID,
		},
	}

	for _, t := range tasks {
		if err := database.FirstOrCreate(&t, models.Task{Title: t.Title, BoardID: t.BoardID}).Error; err != nil {
			log.Fatal("Task insert error:", err)
		}
	}

	log.Println("✅ Inserted example data")
}
