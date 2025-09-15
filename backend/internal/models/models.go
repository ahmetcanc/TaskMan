package models

import "time"

// User tablosu
type User struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"size:100;not null"`
	Email     string `gorm:"uniqueIndex;size:150;not null"`
	Password  string `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time

	Boards []Board
}

// Board tablosu
type Board struct {
	ID        uint   `gorm:"primaryKey"`
	Title     string `gorm:"size:150;not null"`
	UserID    uint   `gorm:"not null;index"`
	CreatedAt time.Time
	UpdatedAt time.Time

	Tasks []Task
}

// Task tablosu
type Task struct {
	ID          uint   `gorm:"primaryKey"`
	Title       string `gorm:"size:150;not null"`
	Description string `gorm:"type:text"`
	Status      string `gorm:"size:50;default:'todo'"` // todo, in-progress, done
	BoardID     uint   `gorm:"not null;index"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
