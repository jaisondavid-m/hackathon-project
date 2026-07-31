package database

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"log"
	"os"

	"server/models"

	mysqlDriver "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(dsn string) (*gorm.DB, error) {
	// Register TiDB custom TLS configuration
	rootCertPool := x509.NewCertPool()
	pem, err := os.ReadFile("cert/isrgrootx1.pem")
	if err != nil {
		// Fallback to server/cert/isrgrootx1.pem if started from workspace root
		pem, err = os.ReadFile("server/cert/isrgrootx1.pem")
		if err != nil {
			return nil, fmt.Errorf("failed to read cert file: %w", err)
		}
	}
	if ok := rootCertPool.AppendCertsFromPEM(pem); !ok {
		return nil, fmt.Errorf("failed to append PEM certificate to pool")
	}

	err = mysqlDriver.RegisterTLSConfig("tidb", &tls.Config{
		RootCAs:    rootCertPool,
		ServerName: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to register custom TLS config: %w", err)
	}

	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection established successfully")

	// Run migrations
	err = DB.AutoMigrate(&models.User{}, &models.HourConfig{}, &models.HolidayConfig{}, &models.AttendanceSession{}, &models.AttendanceRecord{})
	if err != nil {
		return nil, fmt.Errorf("failed to auto-migrate database: %w", err)
	}
	log.Println("Database auto-migration completed")

	// Seed test accounts and hours config if tables are empty
	err = SeedData()
	if err != nil {
		log.Printf("Warning: Seeding test data failed: %v\n", err)
	}

	return DB, nil
}

func SeedData() error {
	var count int64
	// Check if any user exists
	if err := DB.Model(&models.User{}).Count(&count).Error; err != nil {
		return err
	}

	if count == 0 {
		usersToSeed := []struct {
			name     string
			email    string
			password string
			role     string
		}{
			{"System Admin", "admin@bitsathy.ac.in", "admin123", models.RoleAdmin},
			{"Jaison David", "jaisondavidm.cs25@bitsathy.ac.in", "jaison123", models.RoleStudent},
			{"Faculty Member", "faculty@bitsathy.ac.in", "faculty", models.RoleFaculty},
		}

		log.Println("----------------------------------------------------------------------")
		log.Println("NO USERS FOUND. Seeding test accounts:")

		for _, u := range usersToSeed {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
			if err != nil {
				return fmt.Errorf("failed to hash password for %s: %w", u.email, err)
			}

			user := models.User{
				Name:     u.name,
				EmailID:  u.email,
				Password: string(hashedPassword),
				Role:     u.role,
			}

			if err := DB.Create(&user).Error; err != nil {
				return fmt.Errorf("failed to create user %s: %w", u.email, err)
			}

			log.Printf("Seeded: %s | EmailID: %s | Password: %s | Role: %s\n", u.name, u.email, u.password, u.role)
		}
		log.Println("----------------------------------------------------------------------")
	}

	// Seed Hour Configurations
	var hourCount int64
	if err := DB.Model(&models.HourConfig{}).Count(&hourCount).Error; err == nil && hourCount == 0 {
		defaultHours := []models.HourConfig{
			{HourNumber: 1, StartTime: "09:00 AM", EndTime: "10:00 AM"},
			{HourNumber: 2, StartTime: "10:00 AM", EndTime: "11:00 AM"},
			{HourNumber: 3, StartTime: "11:00 AM", EndTime: "12:00 PM"},
			{HourNumber: 4, StartTime: "12:00 PM", EndTime: "01:00 PM"},
			{HourNumber: 5, StartTime: "02:00 PM", EndTime: "03:00 PM"},
			{HourNumber: 6, StartTime: "03:00 PM", EndTime: "04:00 PM"},
			{HourNumber: 7, StartTime: "04:00 PM", EndTime: "05:00 PM"},
		}

		log.Println("Seeding default 7-hour config...")
		for _, h := range defaultHours {
			if err := DB.Create(&h).Error; err != nil {
				log.Printf("Warning: failed to seed hour %d: %v\n", h.HourNumber, err)
			}
		}
	}

	return nil
}
