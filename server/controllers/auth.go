package controllers

import (
	"errors"
	"net/http"
	"time"

	"server/config"
	"server/database"
	"server/middleware"
	"server/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthController struct {
	DB  *gorm.DB
	Cfg *config.Config
}

func NewAuthController(db *gorm.DB, cfg *config.Config) *AuthController {
	return &AuthController{
		DB:  db,
		Cfg: cfg,
	}
}

// Login authenticates a user and returns a JWT token
func (ac *AuthController) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	// Query user by emailid
	err := ac.DB.Where("emailid = ?", req.EmailID).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			database.LogActivity(req.EmailID, "unknown", "Login Failed", "Email ID not found", c.ClientIP())
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email id or password"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Verify password hash
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		database.LogActivity(user.EmailID, user.Role, "Login Failed", "Invalid password attempt", c.ClientIP())
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email id or password"})
		return
	}

	// Generate JWT Token
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &middleware.Claims{
		UserID:  user.ID,
		EmailID: user.EmailID,
		Role:    user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(ac.Cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Log login event
	database.LogActivity(user.EmailID, user.Role, "Login Success", "Logged in to console", c.ClientIP())

	c.JSON(http.StatusOK, models.LoginResponse{
		Token: tokenString,
		User:  user,
	})
}

// CreateUser allows an admin to add a new user (student or faculty or admin)
func (ac *AuthController) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.User
	err := ac.DB.Where("emailid = ?", req.EmailID).First(&existingUser).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email id already exists"})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	// Create user
	newUser := models.User{
		Name:     req.Name,
		EmailID:  req.EmailID,
		Password: string(hashedPassword),
		Role:     req.Role,
	}

	if err := ac.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Log creation event
	adminEmail, _ := c.Get("emailid")
	adminRole, _ := c.Get("role")
	database.LogActivity(
		adminEmail.(string),
		adminRole.(string),
		"Account Created",
		"Created new user account: "+newUser.EmailID+" ("+newUser.Role+")",
		c.ClientIP(),
	)

	c.JSON(http.StatusCreated, newUser)
}

// GetProfile returns the current logged-in user profile
func (ac *AuthController) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found in context"})
		return
	}

	var user models.User
	if err := ac.DB.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	c.JSON(http.StatusOK, user)
}
