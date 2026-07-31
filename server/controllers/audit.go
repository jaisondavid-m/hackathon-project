package controllers

import (
	"net/http"

	"server/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuditController struct {
	DB *gorm.DB
}

func NewAuditController(db *gorm.DB) *AuditController {
	return &AuditController{DB: db}
}

// GetAuditLogs retrieves recent activity audit records (Admin only)
func (ac *AuditController) GetAuditLogs(c *gin.Context) {
	var logs []models.AuditLog
	
	// Query last 200 activity logs, ordered by newest first
	err := ac.DB.Order("created_at desc").Limit(200).Find(&logs).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve audit log records"})
		return
	}

	c.JSON(http.StatusOK, logs)
}
