package controllers

import (
	"net/http"
	"time"

	"server/database"
	"server/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ConfigController struct {
	DB *gorm.DB
}

func NewConfigController(db *gorm.DB) *ConfigController {
	return &ConfigController{DB: db}
}

// GetHourConfigs returns all 7 period configurations
func (cc *ConfigController) GetHourConfigs(c *gin.Context) {
	var hours []models.HourConfig
	if err := cc.DB.Order("hour_number asc").Find(&hours).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve hour configs"})
		return
	}
	c.JSON(http.StatusOK, hours)
}

// SaveHourConfigs updates the timeslots for hours
func (cc *ConfigController) SaveHourConfigs(c *gin.Context) {
	var req []models.HourConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Transaction to update all timeslots
	err := cc.DB.Transaction(func(tx *gorm.DB) error {
		for _, h := range req {
			err := tx.Model(&models.HourConfig{}).
				Where("hour_number = ?", h.HourNumber).
				Updates(map[string]interface{}{
					"start_time": h.StartTime,
					"end_time":   h.EndTime,
				}).Error
			if err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update hour configs"})
		return
	}

	// Log configurations edit
	adminEmail, _ := c.Get("emailid")
	adminRole, _ := c.Get("role")
	database.LogActivity(
		adminEmail.(string),
		adminRole.(string),
		"Hours Config Saved",
		"Updated timeslots configurations for daily hours",
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, gin.H{"message": "Hour configurations saved successfully"})
}

// GetHolidays returns all holiday overrides
func (cc *ConfigController) GetHolidays(c *gin.Context) {
	var holidays []models.HolidayConfig
	if err := cc.DB.Find(&holidays).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve holidays"})
		return
	}
	c.JSON(http.StatusOK, holidays)
}

// SaveHoliday updates or inserts a calendar day status override (Holiday/Working)
func (cc *ConfigController) SaveHoliday(c *gin.Context) {
	var req models.HolidayConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Date is required"})
		return
	}

	// Use GORM Save to perform insert or update (upsert)
	if err := cc.DB.Save(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save calendar override"})
		return
	}

	// Log calendar override
	adminEmail, _ := c.Get("emailid")
	adminRole, _ := c.Get("role")
	statusStr := "Working Day"
	if req.IsHoliday {
		statusStr = "Holiday"
	} else if req.IsHalfDay {
		statusStr = "Half Day"
	}
	database.LogActivity(
		adminEmail.(string),
		adminRole.(string),
		"Holiday Override Saved",
		"Set date "+req.Date+" to status: "+statusStr+" ("+req.Name+")",
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, req)
}

type BatchHolidayRequest struct {
	StartDate string `json:"start_date" binding:"required"`
	EndDate   string `json:"end_date" binding:"required"`
	Name      string `json:"name"`
	IsHoliday bool   `json:"is_holiday"`
	IsHalfDay bool   `json:"is_half_day"`
}

// SaveHolidayBatch saves calendar overrides for a range of dates (Admin only)
func (cc *ConfigController) SaveHolidayBatch(c *gin.Context) {
	var req BatchHolidayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	start, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format, must be YYYY-MM-DD"})
		return
	}

	end, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format, must be YYYY-MM-DD"})
		return
	}

	if start.After(end) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Start date cannot be after end date"})
		return
	}

	var savedConfigs []models.HolidayConfig

	// Loop through dates
	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		config := models.HolidayConfig{
			Date:      dateStr,
			Name:      req.Name,
			IsHoliday: req.IsHoliday,
			IsHalfDay: req.IsHalfDay,
		}

		if err := cc.DB.Save(&config).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save calendar override at " + dateStr})
			return
		}
		savedConfigs = append(savedConfigs, config)
	}

	// Log event
	adminEmail, _ := c.Get("emailid")
	adminRole, _ := c.Get("role")
	statusStr := "Working Day"
	if req.IsHoliday {
		statusStr = "Holiday"
	} else if req.IsHalfDay {
		statusStr = "Half Day"
	}

	database.LogActivity(
		adminEmail.(string),
		adminRole.(string),
		"Batch Holiday Override Saved",
		"Set dates from "+req.StartDate+" to "+req.EndDate+" to status: "+statusStr+" ("+req.Name+")",
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, savedConfigs)
}
