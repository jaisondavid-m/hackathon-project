package models

import "time"

type Venue struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:255;not null" json:"name"`
	Lat1      float64   `gorm:"not null" json:"lat1"`
	Lon1      float64   `gorm:"not null" json:"lon1"`
	Lat2      float64   `gorm:"not null" json:"lat2"`
	Lon2      float64   `gorm:"not null" json:"lon2"`
	Lat3      float64   `gorm:"not null" json:"lat3"`
	Lon3      float64   `gorm:"not null" json:"lon3"`
	Lat4      float64   `gorm:"not null" json:"lat4"`
	Lon4      float64   `gorm:"not null" json:"lon4"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
