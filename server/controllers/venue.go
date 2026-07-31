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

// UpdateVenue updates an existing geofenced venue (Admin only)
func (vc *VenueController) UpdateVenue(c *gin.Context) {
	id := c.Param("id")
	var venue models.Venue
	if err := vc.DB.First(&venue, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Venue not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	var req models.Venue
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Venue name is required"})
		return
	}

	// Update fields
	venue.Name = req.Name
	venue.Lat1 = req.Lat1
	venue.Lon1 = req.Lon1
	venue.Lat2 = req.Lat2
	venue.Lon2 = req.Lon2
	venue.Lat3 = req.Lat3
	venue.Lon3 = req.Lon3
	venue.Lat4 = req.Lat4
	venue.Lon4 = req.Lon4

	if err := vc.DB.Save(&venue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update venue"})
		return
	}

	// Log venue update event
	adminEmail, _ := c.Get("emailid")
	adminRole, _ := c.Get("role")
	database.LogActivity(
		adminEmail.(string),
		adminRole.(string),
		"Venue Updated",
		"Updated coordinates/name for venue: "+venue.Name,
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, venue)
}
