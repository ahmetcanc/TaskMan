package cache

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

var Ctx = context.Background()

func RedisConnect() *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // şifre yoksa boş bırak
		DB:       0,
	})

	if err := rdb.Ping(Ctx).Err(); err != nil {
		log.Fatal("Redis connect error:", err)
	}

	log.Println("✅ Redis connected")
	return rdb
}
