package controllers

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"net/http"
	"os"
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

// Converts lat/lon to flat-space meters relative to some latitude reference.
func latLonToMeters(lat, lon, refLat float64) (x, y float64) {
	const metersPerDegree = 111139.0
	rad := refLat * math.Pi / 180.0
	cosRef := math.Cos(rad)

	y = lat * metersPerDegree
	x = lon * metersPerDegree * cosRef
	return x, y
}

// Calculates the shortest distance in meters from point P(px, py) to segment AB.
func distanceToSegment(px, py, ax, ay, bx, by float64) float64 {
	dx := bx - ax
	dy := by - ay

	l2 := dx*dx + dy*dy
	if l2 == 0 {
		pdx := px - ax
		pdy := py - ay
		return math.Sqrt(pdx*pdx + pdy*pdy)
	}

	t := ((px-ax)*dx + (py-ay)*dy) / l2
	if t < 0 {
		t = 0
	} else if t > 1 {
		t = 1
	}

	nx := ax + t*dx
	ny := ay + t*dy

	pdx := px - nx
	pdy := py - ny
	return math.Sqrt(pdx*pdx + pdy*pdy)
}

// Ray-casting algorithm to verify if student coordinates are inside or within 20m of the venue box
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
	if inside {
		return true
	}

	// Calculate if point is within 20 meters buffer from any of the boundary segments
	refLat := lat
	px, py := latLonToMeters(lat, lon, refLat)

	p1x, p1y := latLonToMeters(v.Lat1, v.Lon1, refLat)
	p2x, p2y := latLonToMeters(v.Lat2, v.Lon2, refLat)
	p3x, p3y := latLonToMeters(v.Lat3, v.Lon3, refLat)
	p4x, p4y := latLonToMeters(v.Lat4, v.Lon4, refLat)

	segments := [][4]float64{
		{p1x, p1y, p2x, p2y},
		{p2x, p2y, p3x, p3y},
		{p3x, p3y, p4x, p4y},
		{p4x, p4y, p1x, p1y},
	}

	for _, seg := range segments {
		d := distanceToSegment(px, py, seg[0], seg[1], seg[2], seg[3])
		if d <= 20.0 {
			return true
		}
	}

	return false
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

	facultyEmailVal, exists := c.Get("emailid")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Faculty email not found in context"})
		return
	}
	facultyEmail := facultyEmailVal.(string)

	// Fetch faculty mapping configuration
	var mapping models.OtpMapping
	if err := ac.DB.Where("faculty_email = ?", facultyEmail).First(&mapping).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You are not mapped to any class/venue by the Admin. Cannot start session."})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking faculty mapping"})
		}
		return
	}

	// Deactivate any previous active sessions for this class and hour on the current date
	todayStr := time.Now().Format("2006-01-02")
	ac.DB.Model(&models.AttendanceSession{}).
		Where("class_id = ? AND hour_number = ? AND date = ? AND is_active = ?", mapping.ClassID, req.HourNumber, todayStr, true).
		Update("is_active", false)

	// Create new session
	otp := generateOTP()
	expiresAt := time.Now().Add(5 * time.Minute) // Session valid for 5 minutes

	session := models.AttendanceSession{
		FacultyID:  facultyID,
		ClassID:    mapping.ClassID,
		HourNumber: req.HourNumber,
		VenueID:    mapping.VenueID,
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
	facultyRole, _ := c.Get("role")
	database.LogActivity(
		facultyEmail,
		facultyRole.(string),
		"OTP Session Created",
		"Generated OTP "+session.OTP+" for class "+session.ClassID+" - Hour "+fmt.Sprintf("%d", session.HourNumber)+" at venue "+mapping.VenueName,
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

	// Decrypt the OTP payload
	passphrase := os.Getenv("OTP_ENCRYPTION_KEY")
	if passphrase == "" {
		passphrase = "default_otp_secret_key_12345678"
	}

	decryptedOtp, err := DecryptOTP(req.OTP, passphrase)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Failed to decrypt secure verification code. Invalid cipher text."})
		return
	}
	req.OTP = decryptedOtp

	// Fetch student name from User database
	var student models.User
	if err := ac.DB.First(&student, studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student profile not found"})
		return
	}

	// Find active unexpired session for this OTP
	var session models.AttendanceSession
	err = ac.DB.Where("otp = ? AND is_active = ? AND expires_at > ?", req.OTP, true, time.Now()).First(&session).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or expired OTP code"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Find student's class permission mapping configured by Admin
	var mappedStudent models.OtpMappingStudent
	err = ac.DB.Joins("JOIN otp_mappings ON otp_mappings.id = otp_mapping_students.mapping_id").
		Where("otp_mapping_students.student_email = ? AND otp_mappings.class_id = ?", student.EmailID, session.ClassID).
		First(&mappedStudent).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You are not mapped to this class. Attendance denied."})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking student mapping"})
		}
		return
	}

	var venue models.Venue
	if err := ac.DB.Preload("Routers").First(&venue, session.VenueID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve mapped venue configuration"})
		return
	}

	// 1. WiFi Router IP Check
	studentIP := c.ClientIP()
	matchesWifi := false
	for _, r := range venue.Routers {
		if studentIP == r.IPAddress {
			matchesWifi = true
			break
		}
	}

	// 2. Geofencing check
	geofenceOk := false
	if req.Latitude != 0.0 || req.Longitude != 0.0 {
		geofenceOk = isPointInQuadrilateral(req.Latitude, req.Longitude, venue)
	}

	// 3. Validation Logic: EITHER must be true
	if !matchesWifi && !geofenceOk {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Attendance Denied: You are neither connected to the venue's WiFi network nor within the geofenced classroom boundaries.",
		})
		return
	}

	validationMethod := "Geofencing Boundary Check"
	if matchesWifi {
		validationMethod = "WiFi Network Connection (IP: " + studentIP + ")"
	} else if geofenceOk {
		validationMethod = "Geofencing Boundary Check (Lat/Lon: " + fmt.Sprintf("%.6f, %.6f", req.Latitude, req.Longitude) + ")"
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
	// Fetch the faculty name who created this OTP session
	var faculty models.User
	facultyDisplayName := "Faculty"
	if err := ac.DB.First(&faculty, session.FacultyID).Error; err == nil {
		facultyDisplayName = faculty.Name
	}

	record := models.AttendanceRecord{
		StudentID:   studentID,
		StudentName: student.Name,
		ClassID:     session.ClassID,
		HourNumber:  session.HourNumber,
		Date:        session.Date,
		Status:      "present",
		FacultyName: facultyDisplayName,
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
		"Marked present for class "+record.ClassID+" - Hour "+fmt.Sprintf("%d", record.HourNumber)+" at venue "+venue.Name+" via "+validationMethod,
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

func (ac *AttendanceController) GetClassAttendanceLogs(c *gin.Context) {
	hourStr := c.Query("hour_number")
	dateStr := c.Query("date")

	if hourStr == "" || dateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "hour_number and date query parameters are required"})
		return
	}

	var records []models.AttendanceRecord
	err := ac.DB.Where("hour_number = ? AND date = ?", hourStr, dateStr).Find(&records).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query records"})
		return
	}

	c.JSON(http.StatusOK, records)
}

// Decrypts hex-encoded AES-CBC encrypted ciphertext using derived SHA-256 key from passphrase.
func DecryptOTP(encryptedHex string, passphrase string) (string, error) {
	encryptedBytes, err := hex.DecodeString(encryptedHex)
	if err != nil {
		return "", fmt.Errorf("failed to decode hex: %w", err)
	}

	if len(encryptedBytes) < 16 {
		return "", errors.New("ciphertext too short")
	}

	iv := encryptedBytes[:16]
	ciphertext := encryptedBytes[16:]

	// Hash passphrase to 32 bytes (SHA-256)
	key := sha256.Sum256([]byte(passphrase))

	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	if len(ciphertext)%aes.BlockSize != 0 {
		return "", errors.New("ciphertext is not a multiple of the block size")
	}

	mode := cipher.NewCBCDecrypter(block, iv)
	decrypted := make([]byte, len(ciphertext))
	mode.CryptBlocks(decrypted, ciphertext)

	// Unpad PKCS#7
	unpadded, err := pkcs7Unpad(decrypted, aes.BlockSize)
	if err != nil {
		return "", fmt.Errorf("failed to unpad: %w", err)
	}

	return string(unpadded), nil
}

func pkcs7Unpad(data []byte, blockSize int) ([]byte, error) {
	length := len(data)
	if length == 0 {
		return nil, errors.New("empty data")
	}
	if length%blockSize != 0 {
		return nil, errors.New("data size not block multiple")
	}
	padding := int(data[length-1])
	if padding < 1 || padding > blockSize {
		return nil, errors.New("invalid padding byte")
	}
	for i := 0; i < padding; i++ {
		if int(data[length-1-i]) != padding {
			return nil, errors.New("invalid padding character")
		}
	}
	return data[:length-padding], nil
}
