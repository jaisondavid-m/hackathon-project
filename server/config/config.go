package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port      string
	JWTSecret []byte
	DBDSN     string
}

func LoadConfig() *Config {
	port := getEnv("PORT", "8080")
	jwtSecret := getEnv("JWT_SECRET", "supersecretkey")

	dbUser := getEnv("DB_USER", "root")
	dbPassword := getEnv("DB_PASSWORD", "jaison")
	dbHost := getEnv("DB_HOST", "127.0.0.1")
	dbPort := getEnv("DB_PORT", "3306")
	dbName := getEnv("DB_NAME", "hackathon_db")

	// Create MySQL DSN: username:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
	// For GORM, we want to allow parseTime=True to map datetime fields to time.Time in Go
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	return &Config{
		Port:      port,
		JWTSecret: []byte(jwtSecret),
		DBDSN:     dsn,
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
