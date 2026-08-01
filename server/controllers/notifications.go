package controllers

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"server/database"
	"server/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gopkg.in/gomail.v2"
)

type NotificationController struct {
	DB *gorm.DB
}

func NewNotificationController(db *gorm.DB) *NotificationController {
	return &NotificationController{DB: db}
}

type SendEmailRequest struct {
	Title       string `json:"title" binding:"required"`
	Message     string `json:"message" binding:"required"`
	Type        string `json:"type" binding:"required"`
	Target      string `json:"target" binding:"required"`
	TargetEmail string `json:"targetEmail"`
}

// SendNotificationEmail handles broadcasting or sending individual user emails
func (nc *NotificationController) SendNotificationEmail(c *gin.Context) {
	var req SendEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var users []models.User
	var emails []string

	switch req.Target {
	case "all":
		if err := nc.DB.Select("emailid").Where("role IN ('student', 'faculty')").Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipients"})
			return
		}
		for _, u := range users {
			emails = append(emails, u.EmailID)
		}
	case "faculty":
		if err := nc.DB.Select("emailid").Where("role = ?", "faculty").Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipients"})
			return
		}
		for _, u := range users {
			emails = append(emails, u.EmailID)
		}
	case "student":
		if err := nc.DB.Select("emailid").Where("role = ?", "student").Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipients"})
			return
		}
		for _, u := range users {
			emails = append(emails, u.EmailID)
		}
	case "user":
		if req.TargetEmail == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Recipient email is required for target user"})
			return
		}
		emails = append(emails, req.TargetEmail)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target type"})
		return
	}

	if len(emails) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "No recipients found. No emails sent.", "sent_count": 0, "email_success": true})
		return
	}

	smtpHost := os.Getenv("SMTP_HOST")
	if smtpHost == "" {
		smtpHost = "smtp.gmail.com"
	}
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpPort := 587
	if smtpPortStr != "" {
		if port, err := strconv.Atoi(smtpPortStr); err == nil {
			smtpPort = port
		}
	}
	smtpUser := os.Getenv("SMTP_USER")
	if smtpUser == "" {
		smtpUser = "pcdp.attendance@gmail.com"
	}
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	if smtpPassword == "" {
		smtpPassword = "mockpassword" // Default app password placeholder
	}

	dialer := gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPassword)
	dialer.TLSConfig = &tls.Config{InsecureSkipVerify: true}

	// Dial the SMTP connection
	s, dialErr := dialer.Dial()
	emailSuccess := true
	var sendError string

	if dialErr != nil {
		log.Printf("SMTP Dial Warning: %v. Log-only mock send fallback.", dialErr)
		emailSuccess = false
		sendError = dialErr.Error()
	} else {
		defer s.Close()
		
		// Dispatch email to all target addresses
		for _, toEmail := range emails {
			m := gomail.NewMessage()
			m.SetHeader("From", smtpUser)
			m.SetHeader("To", toEmail)
			m.SetHeader("Subject", "[PCDP Alert] "+req.Title)
			m.SetBody("text/html", fmt.Sprintf(`
				<div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
					<h2 style="color: #7D53F6; margin-top: 0;">PCDP Notification Alert</h2>
					<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
					<p><strong>Title:</strong> %s</p>
					<p><strong>Type:</strong> <span style="text-transform: uppercase; font-size: 11px; font-weight: bold; color: #4F46E5;">%s</span></p>
					<div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #7D53F6; margin: 15px 0;">
						<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">%s</p>
					</div>
					<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
					<p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">This email was sent automatically from the PCDP Attendance System.</p>
				</div>
			`, req.Title, req.Type, req.Message))

			if err := gomail.Send(s, m); err != nil {
				log.Printf("Failed to send email to %s: %v", toEmail, err)
				emailSuccess = false
				sendError = err.Error()
			}
		}
	}

	// Log audit trail event
	adminEmail, _ := c.Get("emailid")
	adminRole, _ := c.Get("role")
	detailsStr := fmt.Sprintf("Dispatched notification email to %d users (Target: %s)", len(emails), req.Target)
	if !emailSuccess {
		detailsStr += " - Warning: Email delivery failed: " + sendError
	}

	database.LogActivity(
		adminEmail.(string),
		adminRole.(string),
		"Notification Dispatched",
		detailsStr,
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, gin.H{
		"message":       "Notification processed",
		"sent_count":    len(emails),
		"email_success": emailSuccess,
		"error":         sendError,
	})
}
