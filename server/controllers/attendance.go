package controllers

import (
	"crypto/rand"
	"errors"
	"fmt"
	"net/http"
	"time"

	"server/database"
	"server/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AttendanceController struct {
	DB *gorm.DB
}

func NewAttendanceController(db *gorm.DB) *AttendanceController {
	return &AttendanceController{DB: db}
}

// Helper to generate a secure 6-digit numerical OTP
func generateOTP() string {
	b := make([]byte, 6)
	_, err := rand.Read(b)
	if err != nil {
		// Fallback (rare)
		return "999999"
	}
	for i := 0; i < 6; i++ {
		b[i] = '0' + (b[i] % 10)
	}
	return string(b)
}

type Point struct {
	Lat float64
	Lon float64
}

// Ray-casting algorithm to verify if student coordinates are inside the venue box
func isPointInQuadrilateral(lat, lon float64, v models.Venue) bool {
	vertices := []Point{
		{v.Lat1, v.Lon1},
		{v.Lat2, v.Lon2},
		{v.Lat3, v.Lon3},
		{v.Lat4, v.Lon4},
	}
	inside := false
	j := len(vertices) - 1
	for i := 0; i < len(vertices); i++ {
		if (vertices[i].Lon > lon) != (vertices[j].Lon > lon) &&
			lat < (vertices[j].Lat-vertices[i].Lat)*(lon-vertices[i].Lon)/(vertices[j].Lon-vertices[i].Lon)+vertices[i].Lat {
			inside = !inside
		}
		j = i
	}
	return inside
}

// StartAttendanceSession initiates a new OTP session linked to a venue (Faculty only)
func (ac *AttendanceController) StartAttendanceSession(c *gin.Context) {
	facultyIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Faculty identity not found in context"})
		return
	}
	facultyID := facultyIDVal.(uint)

	var req models.CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify venue exists
	var venue models.Venue
	if err := ac.DB.First(&venue, req.VenueID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Selected venue does not exist"})
		return
	}

	// Deactivate any previous active sessions for this class and hour on the current date
	todayStr := time.Now().Format("2006-01-02")
	ac.DB.Model(&models.AttendanceSession{}).
		Where("class_id = ? AND hour_number = ? AND date = ? AND is_active = ?", req.ClassID, req.HourNumber, todayStr, true).
		Update("is_active", false)

	// Create new session
	otp := generateOTP()
	expiresAt := time.Now().Add(5 * time.Minute) // Session valid for 5 minutes

	session := models.AttendanceSession{
		FacultyID:  facultyID,
		ClassID:    req.ClassID,
		HourNumber: req.HourNumber,
		VenueID:    req.VenueID,
		OTP:        otp,
		Date:       todayStr,
		ExpiresAt:  expiresAt,
		IsActive:   true,
	}

	if err := ac.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create attendance session"})
		return
	}

	// Log session start
	facultyEmail, _ := c.Get("emailid")
	facultyRole, _ := c.Get("role")
	database.LogActivity(
		facultyEmail.(string),
		facultyRole.(string),
		"OTP Session Created",
		"Generated OTP "+session.OTP+" for class "+session.ClassID+" - Hour "+fmt.Sprintf("%d", session.HourNumber)+" at venue "+venue.Name,
		c.ClientIP(),
	)

	c.JSON(http.StatusCreated, session)
}

// GetActiveSessions fetches the active unexpired OTP sessions created by the faculty
func (ac *AttendanceController) GetActiveSessions(c *gin.Context) {
	facultyIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Faculty ID not found in context"})
		return
	}
	facultyID := facultyIDVal.(uint)

	var sessions []models.AttendanceSession
	err := ac.DB.Where("faculty_id = ? AND is_active = ? AND expires_at > ?", facultyID, true, time.Now()).Find(&sessions).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, sessions)
}

// SubmitOTP marks student attendance using OTP and verifies geofencing (Student only)
func (ac *AttendanceController) SubmitOTP(c *gin.Context) {
	studentIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Student ID not found in context"})
		return
	}
	studentID := studentIDVal.(uint)

	var req models.SubmitOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch student name from User database
	var student models.User
	if err := ac.DB.First(&student, studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student profile not found"})
		return
	}

	// Find active unexpired session for this OTP
	var session models.AttendanceSession
	err := ac.DB.Where("otp = ? AND is_active = ? AND expires_at > ?", req.OTP, true, time.Now()).First(&session).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or expired OTP code"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Geolocation Bounding Check
	if req.Latitude == 0.0 && req.Longitude == 0.0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geolocation coordinates are required to mark attendance. Please enable location services."})
		return
	}

	var venue models.Venue
	if err := ac.DB.First(&venue, session.VenueID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve session venue configuration"})
		return
	}

	if !isPointInQuadrilateral(req.Latitude, req.Longitude, venue) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are outside the venue boundaries. Attendance denied."})
		return
	}

	// Check if attendance is already logged for this session
	var existingRecord models.AttendanceRecord
	err = ac.DB.Where("student_id = ? AND class_id = ? AND hour_number = ? AND date = ?", studentID, session.ClassID, session.HourNumber, session.Date).First(&existingRecord).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already marked attendance for this class hour today"})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Create Attendance Record
	record := models.AttendanceRecord{
		StudentID:   studentID,
		StudentName: student.Name,
		ClassID:     session.ClassID,
		HourNumber:  session.HourNumber,
		Date:        session.Date,
		Status:      "present",
	}

	if err := ac.DB.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log attendance record"})
		return
	}

	// Log attendance marked
	studentEmail, _ := c.Get("emailid")
	studentRole, _ := c.Get("role")
	database.LogActivity(
		studentEmail.(string),
		studentRole.(string),
		"Attendance Marked",
		"Marked present for class "+record.ClassID+" - Hour "+fmt.Sprintf("%d", record.HourNumber)+" at venue "+venue.Name,
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, record)
}

// GetStudentRecords returns attendance records logged by the student
func (ac *AttendanceController) GetStudentRecords(c *gin.Context) {
	studentIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Student identity not found in context"})
		return
	}
	studentID := studentIDVal.(uint)

	var records []models.AttendanceRecord
	if err := ac.DB.Where("student_id = ?", studentID).Order("created_at desc").Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve attendance logs"})
		return
	}

	// Provide stats also
	var totalRecords int64
	var presentRecords int64
	var lateRecords int64

	ac.DB.Model(&models.AttendanceRecord{}).Where("student_id = ?", studentID).Count(&totalRecords)
	ac.DB.Model(&models.AttendanceRecord{}).Where("student_id = ? AND status = ?", studentID, "present").Count(&presentRecords)
	ac.DB.Model(&models.AttendanceRecord{}).Where("student_id = ? AND status = ?", studentID, "late").Count(&lateRecords)

	c.JSON(http.StatusOK, gin.H{
		"records": records,
		"stats": gin.H{
			"total":   totalRecords,
			"present": presentRecords,
			"late":    lateRecords,
			"absent":  0, // absent is computed client-side or defaults
		},
	})
}

// GetClassAttendanceLogs fetches all attendance records logged for a specific session (Faculty only)
func (ac *AttendanceController) GetClassAttendanceLogs(c *gin.Context) {
	classID := c.Query("class_id")
	hourStr := c.Query("hour_number")
	dateStr := c.Query("date")

	if classID == "" || hourStr == "" || dateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "class_id, hour_number, and date query parameters are required"})
		return
	}

	var records []models.AttendanceRecord
	err := ac.DB.Where("class_id = ? AND hour_number = ? AND date = ?", classID, hourStr, dateStr).Find(&records).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query records"})
		return
	}

	c.JSON(http.StatusOK, records)
}
