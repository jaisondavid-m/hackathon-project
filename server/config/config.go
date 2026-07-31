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

	dbUser := "2y92yVy5xdscPQx.root"
	dbPassword := "C9c6q1X8VPfdHIod"
	dbHost := "gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
	dbPort := "4000"
	dbName := "test"

	// Create MySQL DSN: username:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local&tls=tidb
	// For GORM, we want to allow parseTime=True to map datetime fields to time.Time in Go
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=tidb",
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
