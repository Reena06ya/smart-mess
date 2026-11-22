# 🍽️ Smart Mess – Hostel Mess Management Portal

A full-stack, enterprise-grade Hostel Mess Management Portal built with the **MERN** stack (MongoDB, Express, React with Vite & Tailwind CSS, Node.js). 

Designed to streamline hostel dining operations, room-wise student records, monthly fee billing, Razorpay online and verified offline cash payments, daily meal menus, grievance helpdesk with photo evidence, real-time in-app notifications, administrative audit logging, and financial analytics with downloadable PDF and CSV reports.

---

## 🌟 Key Functional Modules

### 1. Multi-Role Authentication & Security
- **Dual User Roles**: `STUDENT` and `ADMIN` (Mess Bhaiya / Warden).
- **Separate Login Experiences**: Dedicated student and admin login views with role validation.
- **Strict Role-Based Access Control (RBAC)**: All sensitive administrative routes (`/api/fees/all`, `/api/students/room-wise`, `/api/analytics/*`) strictly block students with `403 Forbidden`.
- **Tamper-Proof Financial Records**: Students can update personal contact details (phone, diet preference, avatar, password) but room allocations, enrollment IDs, fee amounts, and payment statuses are immutable to students.
- **Administrative Audit Logs**: Immutable recording of all admin operations (offline payments, fee generation, student deactivations, complaint assignments) in `AuditLog` collection.
- **Secure Password Hashing**: Passwords salted and hashed with `bcryptjs` (cost factor 10) on pre-save hooks.
- **Anti-Duplicate Guards**: Prevents duplicate email and enrollment IDs during registration.

### 2. Student Dashboard & Profile
- **Hero Dining Overview**: Live greetings, profile avatar, enrollment ID, hostel block, room & bed number.
- **Financial Cards**: Total Mess Fees, Paid Amount, Pending Balance Due, and Next Payment Due Date.
- **Today's Live Menu Card**: Auto-detects the active meal slot (Breakfast, Lunch, Evening Snacks, Dinner) in Indian Standard Time (IST).
- **Recent Announcements & Open Grievances**: Immediate tracking of open tickets and notices.
- **Quick Actions**: Pay Mess Fees, View Weekly Menu, File Grievance, Meal Rating, and Payment History.

### 3. Monthly Mess Fee Management & Razorpay Payments
- **Automated Billing Engine**: Admin generates monthly invoices across all hostellers with customizable due dates.
- **Individual Fee Assignment**: Assign custom fee amounts to individual students with audit notes.
- **Partial Payments**: Fully supported (e.g., Monthly fee = ₹3,800, Paid = ₹2,000, Remaining = ₹1,800; status becomes `PARTIALLY PAID`).
- **Razorpay Online Payments**: UPI, Debit Card, Credit Card, and Netbanking support. Order creation on backend, cryptographic HMAC-SHA256 signature verification, and Razorpay webhook confirmation.
- **Anti-Duplicate Replay Guard**: Checks duplicate payment IDs before settlement returning `409 Conflict`.
- **Verified Offline Cash/UPI**: Admin manually records cash payments with verification notes and audit trail.
- **Downloadable PDF Receipts**: High-resolution receipts generated via `jspdf` containing student name, roll number, room, amount, transaction ID, date, status, and verification seal.

### 4. Advanced Room-Wise Student Directory
- **Room Block Visualization**: Group students by Block (Block A, B, C), Floor (Ground, 1st, 2nd, 3rd, 4th), and Room Number.
- **Bed Allocation**: Bed-1, Bed-2, Bed-3 allocations per room.
- **Triple Search**: Filter by room number, student name, or enrollment ID.
- **Room Financial Tracking**: Displays total occupants and total pending fee dues room-wise.
- **Status Toggling**: One-click student deactivation when students vacate the hostel.

### 5. 7-Day Food Menu & Student Dining Reviews
- **4 Meals Daily**: Breakfast, Lunch, Evening Snacks, and Dinner.
- **Curated Food Photo Library**: High-resolution dish photos with direct image upload support.
- **Weekly Menu Calendar**: 7-day matrix view with meal timings.
- **Daily Meal Ratings**: Students submit 1–5 star ratings and reviews per meal slot.
- **Community Suggestions**: Students post menu suggestions with peer upvoting.

### 6. Grievance Redressal Helpdesk
- **8 Standard Categories**: *Food Quality, Food Quantity, Hygiene and Cleanliness, Late Food Service, Menu-Related Issues, Staff Behaviour, Water Issues, Other Problems*.
- **5 Ticket Statuses**: `SUBMITTED` -> `UNDER REVIEW` -> `IN PROGRESS` -> `RESOLVED` / `REJECTED`.
- **Evidence Attachments**: Photo upload with client-side 5MB validation.
- **Admin Management**: Assign staff personnel, reply to tickets, and track resolution.
- **Reopen Tickets**: Students can reopen tickets if issues persist.

### 7. Notification System
- **Real-Time Polling & Toast Alerts**: Instant bell notification counter.
- **Dedicated Notification Center**: History, filter by type (fee, complaint, menu, announcement), mark as read, mark all as read.
- **Simulated & SMTP Email Engine**: HTML email notification templates for payments, invoices, registrations, and grievances.

### 8. Admin Analytics & Intelligence
- **10 Key Performance Indicators**: Total students, occupied rooms, billed fees, collected fees, pending fees, overdue fees, successful payments, total complaints, unresolved issues, student rating.
- **6 Interactive SVG Charts**:
  1. Monthly fee collection chart (Billed vs Collected).
  2. Pending vs Paid circular donut gauge.
  3. Room-wise fee collection ranked bars.
  4. Payment collection revenue timeline.
  5. Complaint category breakdown across 8 categories.
  6. Feedback rating distribution (1–5 Stars).
- **Multi-Dimensional Filters**: Cycle month, room number, status (`PAID`, `PENDING`, `PARTIALLY PAID`, `OVERDUE`), date range.
- **Report Exports**: One-click downloadable **CSV Report** and **Executive PDF Audit Report** with university letterhead.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Node.js, Express.js, MongoDB via Mongoose, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `crypto` (HMAC-SHA256).
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React icons, Axios, `jspdf`.
- **Payment Gateway**: Razorpay Checkout SDK & HMAC verification.
- **Database**: MongoDB running on `mongodb://127.0.0.1:27017/smart_mess`.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18.x or v20.x+)
- MongoDB Community Server (v6.x or v7.x) running locally on port `27017` or a MongoDB Atlas cluster URI.

### 1. Clone & Setup Backend
```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env
```

### 2. Configure Backend `.env`
Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_mess
JWT_SECRET=smart_mess_jwt_super_secret_key_2026_production
RAZORPAY_KEY_ID=rzp_test_SmartMess2026Key
RAZORPAY_KEY_SECRET=smartMessSecretKey9928347
RAZORPAY_WEBHOOK_SECRET=smartMessWebhookSecret2026
NODE_ENV=development
```

### 3. Start Backend Server
```bash
cd backend
node server.js
# Server runs on http://localhost:5000
```

### 4. Setup & Start Frontend
```bash
cd frontend
npm install
npm run dev
# Vite server runs on http://localhost:3000
```

---

## 🔑 Demo Login Credentials

| Role | Portal | Email | Password |
| :--- | :--- | :--- | :--- |
| **Mess Bhaiya (Admin)** | Admin Portal | `bhaiya@smartmess.in` | `password123` |
| **Student (Hosteller)** | Student Portal | `rahul@student.in` | `password123` |

*(You can also click the "Demo Student" or "Demo Admin" quick-fill buttons on the login page).*

---

## 🧪 Comprehensive QA Test Suite

To run the full end-to-end audit test suite covering database connectivity, registration, RBAC, partial payments, signature verification, duplicate prevention, complaints, ratings, notifications, and analytics:

```bash
node scratch/comprehensive_e2e_audit.js
```

All 10 test suites run automatically and assert 100% pass rates.

---

## 🚢 Production Deployment Instructions

### Option A: Traditional VPS (Ubuntu / Debian + Nginx + PM2)
1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   # Creates optimized static assets in frontend/dist
   ```
2. **Serve with PM2**:
   ```bash
   cd backend
   npm install -g pm2
   pm2 start server.js --name "smart-mess-api"
   pm2 save
   pm2 startup
   ```
3. **Nginx Reverse Proxy Configuration**:
   ```nginx
   server {
       listen 80;
       server_name mess.hostel.edu;

       # Serve Frontend SPA
       location / {
           root /var/www/smart-mess/frontend/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # Proxy Backend API
       location /api/ {
           proxy_pass http://127.0.0.1:5000/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
4. **Enable SSL**:
   ```bash
   sudo certbot --nginx -d mess.hostel.edu
   ```

### Option B: Cloud Container Deployment (Docker / Cloud Run / Render)
1. Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NODE_ENV=production`) in your cloud provider dashboard.
2. In production, ensure `NODE_ENV=production` is set so detailed stack traces are hidden from API error responses.

---

## 📄 License
Academic & Institutional License © 2026 Smart Mess Development Team.
