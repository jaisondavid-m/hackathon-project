package middleware

import (
	"bytes"
	"fmt"
	"io"
	"server/database"
	"time"

	"github.com/gin-gonic/gin"
)

// AuditLogMiddleware logs all incoming HTTP/HTTPS requests to the AuditLog database table, including request body for POST requests.
func AuditLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		
		// Capture request body for POST requests before it is consumed by the controllers
		var requestBody string
		if c.Request.Method == "POST" && c.Request.Body != nil {
			bodyBytes, err := io.ReadAll(c.Request.Body)
			if err == nil {
				requestBody = string(bodyBytes)
				// Restore request body so subsequent handlers can read it
				c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
			}
		}

		// Process request
		c.Next()
		
		duration := time.Since(start)

		// Don't log the audit-logs retrieval endpoint to avoid recursion/infinite loops
		if c.Request.URL.Path == "/api/admin/audit-logs" {
			return
		}

		// Retrieve authenticated user info from context if set by AuthMiddleware
		email := "anonymous"
		if emailVal, exists := c.Get("emailid"); exists {
			if e, ok := emailVal.(string); ok {
				email = e
			}
		}

		role := "guest"
		if roleVal, exists := c.Get("role"); exists {
			if r, ok := roleVal.(string); ok {
				role = r
			}
		}

		// Save request details. If it's a POST request and we have a body, include the body details.
		action := fmt.Sprintf("%s %s", c.Request.Method, c.Request.URL.Path)
		
		var details string
		if c.Request.Method == "POST" && requestBody != "" {
			details = fmt.Sprintf("Status: %d | Duration: %v | Body: %s", c.Writer.Status(), duration, requestBody)
		} else {
			details = fmt.Sprintf("Status: %d | Duration: %v", c.Writer.Status(), duration)
		}

		// Record activity
		database.LogActivity(email, role, action, details, c.ClientIP())
	}
}
