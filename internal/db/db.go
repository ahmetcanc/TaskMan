package db

import (
	"log"

	"github.com/ahmetcanc/TaskMan/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect() *gorm.DB {
	// Local PostgreSQL connection string
	dsn := "host=localhost user=postgres password=Acc1905. dbname=TaskMan port=5432 sslmode=disable"

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
