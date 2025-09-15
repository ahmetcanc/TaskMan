package db

import (
	"fmt"
	"log"
	"os"

	"github.com/ahmetcanc/TaskMan/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect() *gorm.DB {
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, dbname, port,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ failed to connect database:", err)
	}

	// Tabloları migrate et
	err = db.AutoMigrate(&models.User{}, &models.Board{}, &models.Task{})
	if err != nil {
		log.Fatal("❌ failed to run migrations:", err)
	}

	log.Println("✅ Database connected & migrated")
	return db
}
