# Attendance Monitoring with QR Code Check-in

### 🚀 Hackathon Project Reference

**Attendance Monitoring with QR Code Check-in** is an intelligent, high-trust classroom attendance system designed to eliminate "proxy" attendance and check-in manipulation. By combining location verification, local campus network validation, and secure cryptographic handshakes, the system guarantees that attendance can only be marked by students physically present in the classroom.

---

## 🌟 The Core Problem: OTP Manipulation & Proxies

Traditional classroom attendance methods—and even basic digital barcode/OTP systems—suffer from key security vulnerabilities:
1. **The Remote Sharing Exploit**: A student in class takes a photo of the projected OTP/QR code and messages it to their friends who are outside the classroom or in their hostel rooms.
2. **Delayed Check-Ins**: Sharing code snapshots allows classmates to mark themselves present hours later or from completely different locations.

---

## 🛡️ Our Solution: How it Solves Attendance Exploits

This system solves the proxy problem by enforcing **Double-Lock Verification** using location boundaries, local WiFi connections, and request security mechanisms.

### 1. Hybrid "OR" Verification
To successfully submit an attendance code, the system validates the student using two independent checks. **If either validation is successful, attendance is marked:**
* **Digital Geofencing (Classroom Boundaries)**: The system draws a precise virtual polygon around the physical classroom. The student's device must be within these GPS coordinates.
* **WiFi Router Matching (Campus Network)**: The system detects the student's connection IP address and verifies it against the specific physical routers installed inside that classroom. 

*Why this works:* A student sitting in the hostel cannot mark attendance because they are outside the classroom coordinates and not connected to that room's specific WiFi router—even if a friend sends them the OTP code.

### 2. Time-Restricted Sessions (7 Seconds Expiry)
Attendance codes are dynamically generated and expire automatically after 7 seconds. This creates a tiny window of opportunity that prevents sharing codes for later use.

### Hashed OTP Verification
To prevent students from sniffing/monitoring HTTP request payloads and manually marking attendance using external platforms like Postman, the system employs a secure hashing algorithm. 
* **Client-Side Hashing**: The student's device hashes the OTP code before transmitting it.
* **Backend Validation**: The Go backend verifies and validates the hashed value rather than raw texts, blocking requests from being intercepted and replayed manually.

### 3. Clear Verification Audits
Administrative panels log exactly how each student was verified (e.g., *"Verified via classroom WiFi Router (IP: 192.168.1.10)"* or *"Verified via Geofence GPS Coordinates"*). This creates a high-trust verification trail.

### 4. Admin Threat Notifications & Logs
If any user attempts to perform unauthorized actions repeatedly (again and again), the system automatically acts to flag the behavior:
* **Admin Notifications & Mail**: The system triggers real-time alerts and dispatches emails to the administrator using the Go backend's `gomail` integration.
* **Audit Inspection**: Admins can instantly review the logs to trace the actor's history, specific actions, timestamps, and client IP addresses.

---

## 🔄 User Workflow: How it Works

### For Faculty Staff
1. **Start Session**: Select the class hour on the dashboard.
2. **Display Code**: The system displays a unique, secure OTP code alongside a solid black QR Code.
3. **Automatic Expiry**: The code remains active for the configured period and then deactivates.

### For Students
1. **Scan QR Code**: Open the console on a mobile browser and scan the classroom QR code.
2. **Mark Attendance**: Enter the OTP. The system automatically fetches device coordinates and network IP details in the background.
3. **Instant Validation**: If the student is physically present inside the boundary or connected to the classroom WiFi, the present status is instantly recorded.

---

## 🛠️ Technical Stack & Skills Used

While the user experience is kept simple and non-technical, the backend runs on a highly modern development stack:

### Frontend (User Interface)
* **React & Vite**: Built as a responsive Single-Page Application (SPA).
* **Vanilla CSS**: Styled with smooth gradients, warm welcoming greetings, and glassmorphic card elements for a premium, dashboard-quality experience.
* **Google Identity SDK**: Integrated with official Google Sign-In button handlers to verify student/staff credentials.

### Backend (API Services & Security)
* **Go (Golang)**: High-performance, statically typed API backend utilizing the Gin router.
* **MySQL Database**: A robust database engine chosen for storing relationships and logs.
* **GORM (Go Object Relational Mapper)**: Controls the MySQL database connections for better performance, handling transactions, relationships, and schema migrations.
* **Gomail & SMTP**: Dispatches styled HTML email notifications to registered accounts.
* **Mathematical Bounding Checks**: Runs a ray-casting polygon mathematical check to determine if coordinate points fall inside the classroom boundaries.

### Infrastructure & Deployment
* **Docker & Docker Compose**: Containerizes the MySQL database, Go backend, and Nginx frontend for reliable, single-command installations.
* **Caddy Server**: Serves as a reverse proxy, managing SSL/TLS certificates and routing traffic securely.
