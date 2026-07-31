package controllers

import (
	"net/http"

	"server/database"
	"server/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type VenueController struct {
	DB *gorm.DB
}

func NewVenueController(db *gorm.DB) *VenueController {
	return &VenueController{DB: db}
}

// GetVenues returns all registered venues
func (vc *VenueController) GetVenues(c *gin.Context) {
	var venues []models.Venue
	if err := vc.DB.Order("name asc").Find(&venues).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve venues"})
		return
	}
	c.JSON(http.StatusOK, venues)
}

// CreateVenue creates a new geofenced venue (Admin only)
func (vc *VenueController) CreateVenue(c *gin.Context) {
	var req models.Venue
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Venue name is required"})
		return
	}

	if err := vc.DB.Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create venue"})
		return
	}

	// Log venue creation event
	adminEmail, _ := c.Get("emailid")
	adminRole, _ := c.Get("role")
	database.LogActivity(
		adminEmail.(string),
		adminRole.(string),
		"Venue Created",
		"Created new bounding geofenced venue: "+req.Name,
		c.ClientIP(),
	)

	c.JSON(http.StatusCreated, req)
}
