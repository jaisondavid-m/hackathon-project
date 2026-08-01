-- PCDP 4.0 Attendance Console Database Schema Reference

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `emailid` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `is_blocked` BOOLEAN DEFAULT FALSE,
    `last_sign` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    KEY `idx_users_deleted_at` (`deleted_at`),
    KEY `idx_users_emailid` (`emailid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Venues Table
CREATE TABLE IF NOT EXISTS `venues` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `lat1` DOUBLE NOT NULL,
    `lon1` DOUBLE NOT NULL,
    `lat2` DOUBLE NOT NULL,
    `lon2` DOUBLE NOT NULL,
    `lat3` DOUBLE NOT NULL,
    `lon3` DOUBLE NOT NULL,
    `lat4` DOUBLE NOT NULL,
    `lon4` DOUBLE NOT NULL,
    `router_count` INT DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Venue Routers Table
CREATE TABLE IF NOT EXISTS `venue_routers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `venue_id` BIGINT UNSIGNED NOT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    CONSTRAINT `fk_venues_routers` FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Hour Configurations Table
CREATE TABLE IF NOT EXISTS `hour_configs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `hour_number` INT NOT NULL UNIQUE,
    `start_time` VARCHAR(50) NOT NULL,
    `end_time` VARCHAR(50) NOT NULL,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_hour_configs_hour_number` (`hour_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Holiday Configurations Table
CREATE TABLE IF NOT EXISTS `holiday_configs` (
    `date` VARCHAR(20) PRIMARY KEY, -- Format: YYYY-MM-DD
    `name` VARCHAR(255) DEFAULT NULL,
    `is_holiday` BOOLEAN DEFAULT TRUE,
    `is_half_day` BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Attendance Sessions Table
CREATE TABLE IF NOT EXISTS `attendance_sessions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `faculty_id` BIGINT UNSIGNED NOT NULL,
    `class_id` VARCHAR(255) NOT NULL,
    `hour_number` INT NOT NULL,
    `venue_id` BIGINT UNSIGNED NOT NULL,
    `otp` VARCHAR(6) NOT NULL,
    `date` VARCHAR(20) NOT NULL, -- Format: YYYY-MM-DD
    `expires_at` DATETIME NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    KEY `idx_attendance_sessions_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Attendance Records Table
CREATE TABLE IF NOT EXISTS `attendance_records` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `student_name` VARCHAR(255) DEFAULT NULL,
    `class_id` VARCHAR(255) NOT NULL,
    `hour_number` INT NOT NULL,
    `date` VARCHAR(20) NOT NULL, -- Format: YYYY-MM-DD
    `status` VARCHAR(50) DEFAULT 'present',
    `faculty_name` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    KEY `idx_attendance_records_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `actor_email` VARCHAR(255) NOT NULL,
    `actor_role` VARCHAR(50) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `details` TEXT NOT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. OTP Mappings Table
CREATE TABLE IF NOT EXISTS `otp_mappings` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `faculty_email` VARCHAR(255) NOT NULL,
    `faculty_name` VARCHAR(255) DEFAULT NULL,
    `class_id` VARCHAR(255) NOT NULL,
    `class_name` VARCHAR(255) DEFAULT NULL,
    `venue_id` BIGINT UNSIGNED NOT NULL,
    `venue_name` VARCHAR(255) DEFAULT NULL,
    `student_email` VARCHAR(255) DEFAULT '',
    `student_name` VARCHAR(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. OTP Mapping Students Table
CREATE TABLE IF NOT EXISTS `otp_mapping_students` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mapping_id` BIGINT UNSIGNED NOT NULL,
    `student_email` VARCHAR(255) NOT NULL,
    `student_name` VARCHAR(255) DEFAULT NULL,
    CONSTRAINT `fk_otp_mapping_students` FOREIGN KEY (`mapping_id`) REFERENCES `otp_mappings`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
