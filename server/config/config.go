package config

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Port      string
	JWTSecret []byte
	DBDSN     string
}

func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if (strings.HasPrefix(value, "\"") && strings.HasSuffix(value, "\"")) ||
			(strings.HasPrefix(value, "'") && strings.HasSuffix(value, "'")) {
			value = value[1 : len(value)-1]
		}
		if key != "" {
			os.Setenv(key, value)
		}
	}
}

func LoadConfig() *Config {
	loadEnvFile(".env")
	loadEnvFile("server/.env")

	port := getEnv("PORT", "8080")
	jwtSecret := getEnv("JWT_SECRET", "supersecretkey")

	dbHost := getEnv("DB_HOST", "gateway01.ap-southeast-1.prod.aws.tidbcloud.com")
	dbPort := getEnv("DB_PORT", "4000")
	dbUser := getEnv("DB_USER", "2y92yVy5xdscPQx.root")
	dbPassword := getEnv("DB_PASSWORD", "C9c6q1X8VPfdHIod")
	dbName := getEnv("DB_NAME", "test")

	var dsn string
	if dbHost == "localhost" || dbHost == "127.0.0.1" || dbHost == "mysql" || getEnv("DB_TLS", "false") == "false" {
		if os.Getenv("DB_USER") == "" {
			dbUser = "root"
		}
		if os.Getenv("DB_PASSWORD") == "" {
			dbPassword = "jaison"
		}
		if os.Getenv("DB_NAME") == "" {
			dbName = "hackathon_db"
		}
		if os.Getenv("DB_PORT") == "" {
			dbPort = "3306"
		}
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			dbUser, dbPassword, dbHost, dbPort, dbName)
	} else {
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=tidb",
			dbUser, dbPassword, dbHost, dbPort, dbName)
	}

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
