package cache

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var Ctx = context.Background()

func RedisConnect() *redis.Client {
	// Redis host ve port environment değişkenlerinden okunuyor
	redisHost := os.Getenv("REDIS_HOST") // docker-compose’da "redis"
	redisPort := os.Getenv("REDIS_PORT") // 6379

	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password: "", // şifre yoksa boş bırak
		DB:       0,
	})

	if err := rdb.Ping(Ctx).Err(); err != nil {
		log.Fatal("Redis connect error:", err)
	}

	log.Println("✅ Redis connected")
	return rdb
}
