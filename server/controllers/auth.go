package controllers

import (
	"encoding/json"
	"errors"
	"io"
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

	// Check if user is blocked
	if user.IsBlocked {
		database.LogActivity(user.EmailID, user.Role, "Login Failed", "Blocked account login attempt", c.ClientIP())
		c.JSON(http.StatusForbidden, gin.H{"error": "Your account has been blocked by an administrator."})
		return
	}

	// Update last sign in timestamp
	now := time.Now()
	user.LastSignIn = &now
	ac.DB.Save(&user)

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

type GoogleTokenInfo struct {
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Audience      string `json:"aud"`
	Error         string `json:"error"`
}

type GoogleLoginRequest struct {
	IDToken string `json:"id_token" binding:"required"`
}

// LoginGoogle authenticates a user using a Google credentials ID token
func (ac *AuthController) LoginGoogle(c *gin.Context) {
	var req GoogleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Call Google tokeninfo API to verify token validity and read email address
	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + req.IDToken)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to reach Google token verification service"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google sign-in credentials"})
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read Google token details"})
		return
	}

	var info GoogleTokenInfo
	if err := json.Unmarshal(body, &info); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process Google sign-in credentials"})
		return
	}

	if info.Error != "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Google verification error: " + info.Error})
		return
	}

	if info.Email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Google sign-in did not yield a valid email address"})
		return
	}

	// 2. Query user by email from database
	var user models.User
	err = ac.DB.Where("emailid = ?", info.Email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			database.LogActivity(info.Email, "unknown", "Google Login Failed", "Email not registered in database", c.ClientIP())
			c.JSON(http.StatusNotFound, gin.H{"error": "User email address is not registered in the system database."})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking user registration"})
		}
		return
	}

	// Check if user is blocked
	if user.IsBlocked {
		database.LogActivity(user.EmailID, user.Role, "Google Login Failed", "Blocked account login attempt", c.ClientIP())
		c.JSON(http.StatusForbidden, gin.H{"error": "Your account has been blocked by an administrator."})
		return
	}

	// Update last sign in timestamp
	now := time.Now()
	user.LastSignIn = &now
	ac.DB.Save(&user)

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

	// Log successful login event
	database.LogActivity(user.EmailID, user.Role, "Google Login Success", "Logged in via Google Authentication", c.ClientIP())

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

// GetUsers lists all registered users in the database (Admin only)
func (ac *AuthController) GetUsers(c *gin.Context) {
	var users []models.User
	if err := ac.DB.Order("created_at desc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// ToggleBlockUser blocks or unblocks a user by ID (Admin only)
func (ac *AuthController) ToggleBlockUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := ac.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Don't allow admins to block themselves
	adminEmail, _ := c.Get("emailid")
	if user.EmailID == adminEmail.(string) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot block your own admin account"})
		return
	}

	user.IsBlocked = !user.IsBlocked
	if err := ac.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user block status"})
		return
	}

	// Log event
	actionStr := "Account Unblocked"
	if user.IsBlocked {
		actionStr = "Account Blocked"
	}
	adminRole, _ := c.Get("role")
	database.LogActivity(
		adminEmail.(string),
		adminRole.(string),
		actionStr,
		"Toggled block status for user: "+user.EmailID,
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, user)
}
