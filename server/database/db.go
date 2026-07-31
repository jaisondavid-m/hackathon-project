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

	// Seed default admin if table is empty
	err = SeedAdmin()
	if err != nil {
		log.Printf("Warning: Seeding admin failed: %v\n", err)
	}

	return DB, nil
}

func SeedAdmin() error {
	var count int64
	// Check if any user exists
	if err := DB.Model(&models.User{}).Count(&count).Error; err != nil {
		return err
	}

	if count == 0 {
		defaultEmail := "admin@example.com"
		defaultPassword := "admin123"
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("failed to hash default admin password: %w", err)
		}

		admin := models.User{
			Name:     "Admin User",
			EmailID:  defaultEmail,
			Password: string(hashedPassword),
			Role:     models.RoleAdmin,
		}

		if err := DB.Create(&admin).Error; err != nil {
			return fmt.Errorf("failed to create default admin: %w", err)
		}

		log.Println("----------------------------------------------------------------------")
		log.Println("NO USERS FOUND. Seeded default admin:")
		log.Printf("EmailID:  %s\n", defaultEmail)
		log.Printf("Password: %s\n", defaultPassword)
		log.Println("----------------------------------------------------------------------")
		log.Println("To manually insert an admin user directly into your database, run:")
		log.Printf("INSERT INTO users (name, emailid, password, role, created_at, updated_at) VALUES ('Admin User', '%s', '%s', 'admin', NOW(), NOW());\n", defaultEmail, string(hashedPassword))
		log.Println("----------------------------------------------------------------------")
	} else {
		// Log the manual SQL example anyway for the user's reference
		tempHash, _ := bcrypt.GenerateFromPassword([]byte("yourpassword"), bcrypt.DefaultCost)
		log.Println("----------------------------------------------------------------------")
		log.Println("MANUAL DATABASE INSERT REFERENCE:")
		log.Println("If you want to manually insert an admin into the database using SQL:")
		log.Printf("INSERT INTO users (name, emailid, password, role, created_at, updated_at) VALUES ('Admin Name', 'admin@example.com', '%s', 'admin', NOW(), NOW());\n", string(tempHash))
		log.Println("----------------------------------------------------------------------")
	}

	return nil
}
