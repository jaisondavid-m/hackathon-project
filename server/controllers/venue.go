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

// GetVenues returns all registered venues with their routers
func (vc *VenueController) GetVenues(c *gin.Context) {
	var venues []models.Venue
	if err := vc.DB.Preload("Routers").Order("name asc").Find(&venues).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve venues"})
		return
	}
	c.JSON(http.StatusOK, venues)
}

type venueRequest struct {
	Name        string   `json:"name"`
	Lat1        float64  `json:"lat1"`
	Lon1        float64  `json:"lon1"`
	Lat2        float64  `json:"lat2"`
	Lon2        float64  `json:"lon2"`
	Lat3        float64  `json:"lat3"`
	Lon3        float64  `json:"lon3"`
	Lat4        float64  `json:"lat4"`
	Lon4        float64  `json:"lon4"`
	RouterCount int      `json:"router_count"`
	RouterIPs   []string `json:"router_ips"`
}

// CreateVenue creates a new geofenced venue with optional router IPs (Admin only)
func (vc *VenueController) CreateVenue(c *gin.Context) {
	var req venueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Venue name is required"})
		return
	}

	// Build router list
	var routers []models.VenueRouter
	for _, ip := range req.RouterIPs {
		if ip != "" {
			routers = append(routers, models.VenueRouter{IPAddress: ip})
		}
	}

	venue := models.Venue{
		Name:        req.Name,
		Lat1:        req.Lat1,
		Lon1:        req.Lon1,
		Lat2:        req.Lat2,
		Lon2:        req.Lon2,
		Lat3:        req.Lat3,
		Lon3:        req.Lon3,
		Lat4:        req.Lat4,
		Lon4:        req.Lon4,
		RouterCount: req.RouterCount,
		Routers:     routers,
	}

	if err := vc.DB.Create(&venue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create venue"})
		return
	}

	// Reload with routers
	vc.DB.Preload("Routers").First(&venue, venue.ID)

	// Log venue creation event
	adminEmail, _ := c.Get("emailid")
	adminRole, _ := c.Get("role")
	database.LogActivity(
		adminEmail.(string),
		adminRole.(string),
		"Venue Created",
		"Created new bounding geofenced venue: "+venue.Name,
		c.ClientIP(),
	)

	c.JSON(http.StatusCreated, venue)
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

	var req venueRequest
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
	venue.RouterCount = req.RouterCount

	if err := vc.DB.Save(&venue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update venue"})
		return
	}

	// Replace routers: delete old, insert new
	vc.DB.Where("venue_id = ?", venue.ID).Delete(&models.VenueRouter{})
	for _, ip := range req.RouterIPs {
		if ip != "" {
			vc.DB.Create(&models.VenueRouter{
				VenueID:   venue.ID,
				IPAddress: ip,
			})
		}
	}

	// Reload with routers
	vc.DB.Preload("Routers").First(&venue, venue.ID)

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
