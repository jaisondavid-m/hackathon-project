package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	RoleAdmin   = "admin"
	RoleFaculty = "faculty"
	RoleStudent = "student"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:255;not null" json:"name"`
	EmailID   string         `gorm:"column:emailid;size:255;uniqueIndex;not null" json:"emailid"`
	Password  string         `gorm:"size:255;not null" json:"-"`
	Role      string         `gorm:"type:varchar(50);not null" json:"role"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type LoginRequest struct {
	EmailID  string `json:"emailid" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateUserRequest struct {
	Name     string `json:"name" binding:"required"`
	EmailID  string `json:"emailid" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=admin faculty student"`
}
