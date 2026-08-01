package models

import (
	"time"

	"gorm.io/gorm"
)

type AttendanceSession struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	FacultyID  uint           `gorm:"not null" json:"faculty_id"`
	ClassID    string         `gorm:"size:255;not null" json:"class_id"`
	HourNumber int            `gorm:"not null" json:"hour_number"`
	VenueID    uint           `gorm:"not null" json:"venue_id"`
	OTP        string         `gorm:"size:6;not null" json:"otp"`
	Date       string         `gorm:"size:20;not null" json:"date"` // Format: YYYY-MM-DD
	ExpiresAt  time.Time      `gorm:"not null" json:"expires_at"`
	IsActive   bool           `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type AttendanceRecord struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	StudentID   uint           `gorm:"not null" json:"student_id"`
	StudentName string         `gorm:"size:255" json:"student_name"`
	ClassID     string         `gorm:"size:255;not null" json:"class_id"`
	HourNumber  int            `gorm:"not null" json:"hour_number"`
	Date        string         `gorm:"size:20;not null" json:"date"` // Format: YYYY-MM-DD
	Status      string         `gorm:"size:50;default:'present'" json:"status"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type CreateSessionRequest struct {
	ClassID    string `json:"class_id"`
	HourNumber int    `json:"hour_number" binding:"required,min=1,max=7"`
	VenueID    uint   `json:"venue_id"`
}

type SubmitOTPRequest struct {
	OTP       string  `json:"otp" binding:"required,len=6"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type OtpMapping struct {
	ID           uint                 `gorm:"primaryKey" json:"id"`
	FacultyEmail string               `gorm:"size:255;not null" json:"faculty_email"`
	FacultyName  string               `gorm:"size:255" json:"faculty_name"`
	ClassID      string               `gorm:"size:255;not null" json:"class_id"`
	ClassName    string               `gorm:"size:255" json:"class_name"`
	VenueID      uint                 `gorm:"not null" json:"venue_id"`
	VenueName    string               `gorm:"size:255" json:"venue_name"`
	StudentEmail string               `gorm:"size:255;default:''" json:"student_email,omitempty"`
	StudentName  string               `gorm:"size:255;default:''" json:"student_name,omitempty"`
	Students     []OtpMappingStudent  `gorm:"foreignKey:MappingID;constraint:OnDelete:CASCADE" json:"students"`
}

type OtpMappingStudent struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	MappingID    uint   `gorm:"not null" json:"mapping_id"`
	StudentEmail string `gorm:"size:255;not null" json:"student_email"`
	StudentName  string `gorm:"size:255" json:"student_name"`
}

type CreateOtpMappingRequest struct {
	FacultyEmail  string   `json:"faculty_email" binding:"required"`
	ClassID       string   `json:"class_id" binding:"required"`
	VenueID       uint     `json:"venue_id" binding:"required"`
	StudentEmails []string `json:"student_emails" binding:"required"`
}
