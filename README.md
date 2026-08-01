# PCDP 4.0 — Smart Bounding Attendance Console

PCDP 4.0 is an intelligent, high-trust classroom attendance system designed to eliminate "proxy" attendance and check-in manipulation. By combining location verification, local campus network validation, and expiring security keys, the system guarantees that attendance can only be marked by students physically present in the classroom.

---

## 🌟 The Core Problem: OTP Manipulation & Proxies

Traditional classroom attendance methods—and even basic digital barcode/OTP systems—suffer from key security vulnerabilities:
1. **The Remote Sharing Exploit**: A student in class takes a photo of the projected OTP/QR code and messages it to their friends who are outside the classroom or in their hostel rooms.
2. **Delayed Check-Ins**: Sharing code snapshots allows classmates to mark themselves present hours later or from completely different locations.

---

## 🛡️ Our Solution: How PCDP 4.0 Solves Attendance Exploits

PCDP 4.0 solves the proxy problem by enforcing **Double-Lock Verification** using location boundaries and local WiFi connections.

### 1. Hybrid "OR" Verification
To successfully submit an attendance code, the system validates the student using two independent checks. **If either validation is successful, attendance is marked:**
* **Digital Geofencing (Classroom Boundaries)**: The system draws a precise virtual polygon around the physical classroom. The student's device must be within these GPS coordinates.
* **WiFi Router Matching (Campus Network)**: The system detects the student's connection IP address and verifies it against the specific physical routers installed inside that classroom. 

*Why this works:* A student sitting in the hostel cannot mark attendance because they are outside the classroom coordinates and not connected to that room's specific WiFi router—even if a friend sends them the OTP code.

### 2. Time-Restricted Sessions (5-Min Expiry)
Attendance codes are dynamically generated and expire automatically after 5 minutes. This creates a small window of opportunity that prevents sharing codes for later use.

### 3. Clear Verification Audits
Administrative panels log exactly how each student was verified (e.g., *"Verified via classroom WiFi Router (IP: 192.168.1.10)"* or *"Verified via Geofence GPS Coordinates"*). This creates a high-trust verification trail.

---

## 🔄 User Workflow: How it Works

### For Faculty Staff
1. **Start Session**: Select the class hour on the dashboard.
2. **Display Code**: The system displays a unique, secure OTP code alongside a solid black QR Code.
3. **Automatic Expiry**: The code remains active for 5 minutes and then deactivates.

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
* **GORM (Go Object Relational Mapper)**: Handles query mappings, secure transactions, and relational user models.
* **Gomail & SMTP**: Dispatches styled HTML email notifications to registered accounts.
* **Mathematical Bounding Checks**: Runs a ray-casting polygon mathematical check to determine if coordinate points fall inside the classroom boundaries.

### Infrastructure & Deployment
* **Docker & Docker Compose**: Containerizes the MySQL database, Go backend, and Nginx frontend for reliable, single-command installations.
* **Caddy Server**: Serves as a reverse proxy, managing SSL/TLS certificates and routing traffic securely.
