package controllers

import (
	"fmt"
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
	emailVal, _ := c.Get("emailid")
	roleVal, _ := c.Get("role")
	adminEmail, _ := emailVal.(string)
	adminRole, _ := roleVal.(string)
	database.LogActivity(
		adminEmail,
		adminRole,
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
	emailVal, _ := c.Get("emailid")
	roleVal, _ := c.Get("role")
	adminEmail, _ := emailVal.(string)
	adminRole, _ := roleVal.(string)
	statusStr := "Working Day"
	if req.IsHoliday {
		statusStr = "Holiday"
	} else if req.IsHalfDay {
		statusStr = "Half Day"
	}
	database.LogActivity(
		adminEmail,
		adminRole,
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
	emailVal, _ := c.Get("emailid")
	roleVal, _ := c.Get("role")
	adminEmail, _ := emailVal.(string)
	adminRole, _ := roleVal.(string)
	statusStr := "Working Day"
	if req.IsHoliday {
		statusStr = "Holiday"
	} else if req.IsHalfDay {
		statusStr = "Half Day"
	}

	database.LogActivity(
		adminEmail,
		adminRole,
		"Batch Holiday Override Saved",
		"Set dates from "+req.StartDate+" to "+req.EndDate+" to status: "+statusStr+" ("+req.Name+")",
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, savedConfigs)
}

// GetOtpMappings retrieves all mapped student permissions
func (cc *ConfigController) GetOtpMappings(c *gin.Context) {
	var mappings []models.OtpMapping
	if err := cc.DB.Preload("Students").Find(&mappings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve mappings"})
		return
	}
	c.JSON(http.StatusOK, mappings)
}

// CreateOtpMapping creates/updates a student class-venue permission mapping
func (cc *ConfigController) CreateOtpMapping(c *gin.Context) {
	var req models.CreateOtpMappingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.FacultyEmail == "" || req.ClassID == "" || req.VenueID == 0 || len(req.StudentEmails) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "faculty_email, class_id, venue_id, and student_emails are required fields"})
		return
	}

	// Fetch faculty details
	var faculty models.User
	if err := cc.DB.Where("emailid = ? AND role = ?", req.FacultyEmail, "faculty").First(&faculty).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Faculty with email " + req.FacultyEmail + " not found"})
		return
	}

	// Fetch venue details
	var venue models.Venue
	if err := cc.DB.First(&venue, req.VenueID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Selected venue does not exist"})
		return
	}

	// Map classes
	classes := map[string]string{
		"CS101": "Computer Science (CS-A)",
		"CS202": "Data Structures (CS-B)",
		"CS305": "Web Engineering",
	}
	className := classes[req.ClassID]
	if className == "" {
		className = req.ClassID
	}

	// Upsert mapping for faculty + class (a faculty member has one mapping per class)
	var mapping models.OtpMapping
	err := cc.DB.Where("faculty_email = ? AND class_id = ?", req.FacultyEmail, req.ClassID).First(&mapping).Error
	if err == nil {
		// Update existing mapping venue
		mapping.VenueID = req.VenueID
		mapping.VenueName = venue.Name
		mapping.FacultyName = faculty.Name
		mapping.ClassName = className
		if err := cc.DB.Omit("Students").Save(&mapping).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update mapping details: " + err.Error()})
			return
		}
		// Clear existing student relationships
		cc.DB.Where("mapping_id = ?", mapping.ID).Delete(&models.OtpMappingStudent{})
	} else {
		// Create new mapping
		newMapping := models.OtpMapping{
			FacultyEmail: req.FacultyEmail,
			FacultyName:  faculty.Name,
			ClassID:      req.ClassID,
			ClassName:    className,
			VenueID:      req.VenueID,
			VenueName:    venue.Name,
		}
		if err := cc.DB.Omit("Students").Create(&newMapping).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create mapping record: " + err.Error()})
			return
		}
		mapping = newMapping
	}

	// Create new student entries
	for _, email := range req.StudentEmails {
		var student models.User
		if err := cc.DB.Where("emailid = ? AND role = ?", email, "student").First(&student).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Student with email " + email + " not found"})
			return
		}
		studMapping := models.OtpMappingStudent{
			MappingID:    mapping.ID,
			StudentEmail: student.EmailID,
			StudentName:  student.Name,
		}
		if err := cc.DB.Create(&studMapping).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create student mapping for " + email + ": " + err.Error()})
			return
		}
	}

	// Preload and return
	cc.DB.Preload("Students").First(&mapping, mapping.ID)

	// Log activity
	emailVal, _ := c.Get("emailid")
	roleVal, _ := c.Get("role")
	adminEmail, _ := emailVal.(string)
	adminRole, _ := roleVal.(string)
	database.LogActivity(
		adminEmail,
		adminRole,
		"OTP Mapping Configured",
		"Mapped faculty "+mapping.FacultyEmail+" to class "+mapping.ClassID+" in venue "+mapping.VenueName+" with "+fmt.Sprintf("%d", len(mapping.Students))+" students",
		c.ClientIP(),
	)

	c.JSON(http.StatusCreated, mapping)
}

// DeleteOtpMapping removes a mapped student permission
func (cc *ConfigController) DeleteOtpMapping(c *gin.Context) {
	id := c.Param("id")
	cc.DB.Where("mapping_id = ?", id).Delete(&models.OtpMappingStudent{})
	if err := cc.DB.Delete(&models.OtpMapping{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete mapping"})
		return
	}

	// Log activity
	adminEmail, _ := c.Get("emailid")
	adminRole, _ := c.Get("role")
	database.LogActivity(
		adminEmail.(string),
		adminRole.(string),
		"OTP Mapping Deleted",
		"Deleted student OTP mapping ID "+id,
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, gin.H{"message": "Mapping deleted successfully"})
}
