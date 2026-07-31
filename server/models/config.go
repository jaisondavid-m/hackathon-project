package models

import "time"

type HourConfig struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	HourNumber int       `gorm:"uniqueIndex;not null" json:"hour_number"`
	StartTime  string    `gorm:"size:50;not null" json:"start_time"`
	EndTime    string    `gorm:"size:50;not null" json:"end_time"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type HolidayConfig struct {
	Date      string `gorm:"primaryKey;size:20" json:"date"` // Format: YYYY-MM-DD
	Name      string `gorm:"size:255" json:"name"`
	IsHoliday bool   `gorm:"default:true" json:"is_holiday"`
	IsHalfDay bool   `gorm:"column:is_half_day;default:false" json:"is_half_day"`
}
