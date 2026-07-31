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
	log.Println("Starting API server...")

	// Load Configuration
	cfg := config.LoadConfig()

	// Initialize Database
	db, err := database.InitDB(cfg.DBDSN)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}

	// Initialize Controllers
	authController := controllers.NewAuthController(db, cfg)
	configController := controllers.NewConfigController(db)
	attendanceController := controllers.NewAttendanceController(db)
	venueController := controllers.NewVenueController(db)
	auditController := controllers.NewAuditController(db)

	// Set up router
	r := gin.Default()

	// Register Global Audit Logging Middleware
	r.Use(middleware.AuditLogMiddleware())

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
		protected.GET("/hours", configController.GetHourConfigs)
		protected.GET("/holidays", configController.GetHolidays)
		protected.GET("/venues", venueController.GetVenues)

		// Faculty & Admin Routes
		facultyOnly := protected.Group("/")
		facultyOnly.Use(middleware.RequireRole(models.RoleFaculty, models.RoleAdmin))
		{
			facultyOnly.POST("/faculty/sessions", attendanceController.StartAttendanceSession)
			facultyOnly.GET("/faculty/sessions", attendanceController.GetActiveSessions)
			facultyOnly.GET("/faculty/attendance/logs", attendanceController.GetClassAttendanceLogs)
		}

		// Student Routes
		studentOnly := protected.Group("/")
		studentOnly.Use(middleware.RequireRole(models.RoleStudent))
		{
			studentOnly.POST("/student/attendance/submit", attendanceController.SubmitOTP)
			studentOnly.GET("/student/attendance/records", attendanceController.GetStudentRecords)
		}

		// Admin-Only Routes
		adminOnly := protected.Group("/admin")
		adminOnly.Use(middleware.RequireRole(models.RoleAdmin))
		{
			adminOnly.POST("/users", authController.CreateUser)
			adminOnly.GET("/users", authController.GetUsers)
			adminOnly.POST("/users/:id/toggle-block", authController.ToggleBlockUser)
			adminOnly.POST("/hours", configController.SaveHourConfigs)
			adminOnly.POST("/holidays", configController.SaveHoliday)
			adminOnly.POST("/holidays/batch", configController.SaveHolidayBatch)
			adminOnly.POST("/venues", venueController.CreateVenue)
			adminOnly.PUT("/venues/:id", venueController.UpdateVenue)
			adminOnly.GET("/audit-logs", auditController.GetAuditLogs)
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