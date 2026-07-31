package database

import (
	"fmt"
	"log"

	"server/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(dsn string) (*gorm.DB, error) {
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection established successfully")

	// Run migrations
	err = DB.AutoMigrate(&models.User{})
	if err != nil {
		return nil, fmt.Errorf("failed to auto-migrate database: %w", err)
	}
	log.Println("Database auto-migration completed")

	// Seed test accounts if table is empty
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

	return nil
}
