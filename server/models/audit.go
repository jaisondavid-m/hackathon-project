package models

import "time"

type AuditLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ActorEmail string    `gorm:"size:255;not null" json:"actor_email"`
	ActorRole  string    `gorm:"size:50;not null" json:"actor_role"`
	Action     string    `gorm:"size:100;not null" json:"action"`
	Details    string    `gorm:"type:text;not null" json:"details"`
	IPAddress  string    `gorm:"size:45" json:"ip_address"` // Supports IPv6
	CreatedAt  time.Time `json:"created_at"`
}
