package main

import (
	"log"
	"net/http"

	"server/config"
	"server/controllers"
	"server/database"
	"server/middleware"
	"server/models"

	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("Starting Auth API server...")

	// Load Configuration
	cfg := config.LoadConfig()

	// Initialize Database
	db, err := database.InitDB(cfg.DBDSN)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}

	// Initialize Controllers
	authController := controllers.NewAuthController(db, cfg)

	// Set up router
	r := gin.Default()

	// Simple CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	// Public Routes
	r.POST("/api/login", authController.Login)

	// Protected Routes (Required Authentication)
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		protected.GET("/profile", authController.GetProfile)

		// Admin-Only Routes
		adminOnly := protected.Group("/admin")
		adminOnly.Use(middleware.RequireRole(models.RoleAdmin))
		{
			adminOnly.POST("/users", authController.CreateUser)
		}
	}

	// Health Check / Root route
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Auth API is running",
			"status":  "healthy",
		})
	})

	// Start Server
	log.Printf("Server is starting on port %s...\n", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}