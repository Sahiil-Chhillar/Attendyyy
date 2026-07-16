<div align="center">

<h1>
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=32&pause=1000&color=4F9EF7&center=true&vCenter=true&width=500&lines=Attendyy+%F0%9F%93%8B;Smart+Attendance+System" alt="Attendyy" />
</h1>

<p align="center">
  A full-stack MERN attendance management system that eliminates proxy attendance using <strong>dynamic QR codes</strong> and <strong>geolocation verification</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white" />
</p>

</div>

---

## 📌 What is Attendyy?

Attendyy is an attendance management platform built for colleges and institutions that need **verifiable, tamper-proof attendance**. Traditional roll-call and sign-sheet systems are trivially gamed — Attendyy is not.

When a class starts, the **teacher** generates a **time-bound QR code** for that session. A **student** scans it and their attendance is only marked if:

1. Their **live location** falls within the teacher's configured radius (Haversine formula)
2. The **QR session token** is still active (not expired or deactivated)
3. They are **enrolled** in that course and haven't already marked attendance for the session

No more proxies. No more buddy punching.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth & RBAC** | JWT-based auth with three roles — Student / Teacher / Admin |
| 📧 **OTP Verification** | 6-digit email OTP at signup, 10-minute expiry |
| 🔑 **Password Reset** | SHA-256 hashed reset token, 15-minute expiry |
| 📷 **Dynamic QR Sessions** | Teacher generates a UUID-based, time-limited QR per session |
| 📍 **Geolocation Validation** | Haversine formula checks student is physically within the allowed radius |
| 🚫 **Proxy Prevention** | Distance is logged even on rejected attempts, for audit purposes |
| 🖼️ **Cloudinary Avatars** | Profile photos auto-resized to 300×300 and served via CDN |
| 📊 **Attendance Reporting** | Per-course attendance % with a 75% threshold flag |
| 🧑‍🏫 **Course Management** | Admin-managed courses with teacher assignment and student enrollment |
| 🛡️ **RBAC Middleware** | Every protected route is role-checked server-side |

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** — REST API server
- **MongoDB** + **Mongoose** — Database & ODM
- **JWT** + **bcryptjs** — Stateless authentication & password hashing
- **Nodemailer** — OTP and email delivery
- **Haversine** — Geolocation distance calculation
- **Cloudinary** + **Multer** — Avatar upload & storage
- **qrcode** + **uuid** — Session QR generation

### Frontend
- **React 18** + **Vite** — UI framework & build tool
- **React Router v6** — Client-side routing
- **Axios** — HTTP client
- **jsQR** — In-browser QR scanning via canvas
- **react-hot-toast** — Notifications

---

## 📁 Project Structure

```
attendyy/
├── backend/
│   ├── config/              # DB & Cloudinary config
│   ├── controllers/         # auth, qr, attendance, course, admin logic
│   ├── middleware/          # JWT auth guard, role-based access guard
│   ├── models/              # User, Course, Session, Attendance schemas
│   ├── routes/              # authRoutes, qrRoutes, attendanceRoutes, courseRoutes, adminRoutes
│   ├── utils/                # haversine, generateOTP, generateToken, sendEmail
│   └── server.js            # Entry point
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── pages/            # Auth, Dashboard, Session, Scan pages
│       ├── context/          # Auth context (global state)
│       ├── utils/            # Helpers (QR scanning, API calls)
│       └── App.jsx
│
├── .gitignore
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail account (for OTP via Nodemailer)

### 1. Clone the repo

```bash
git clone https://github.com/Sahiil-Chhillar/Attendyy.git
cd Attendyy
```

### 2. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in your `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:3000
```

```bash
npm run dev
```

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

The app runs at `http://localhost:3000` by default.

---

## 👥 Roles

| Role | Capabilities |
|------|-------------|
| **Student** | Register, verify email via OTP, scan session QR, view own attendance history & percentage |
| **Teacher** | Create/deactivate QR sessions with a geolocation radius, view attendance per session/course |
| **Admin** | Manage users & roles, create/manage courses, enroll students, view platform-wide stats |

---

## 🔄 How It Works

```
Teacher creates a session
        ↓
System generates a time-bound, UUID-based QR code
        ↓
Student opens app → scans QR
        ↓
Backend checks:
  ✅ QR token valid & not expired/deactivated?
  ✅ Student enrolled in the course?
  ✅ Student's GPS within the configured radius (Haversine)?
        ↓
Attendance marked & logged (with distance, even if rejected)
        ↓
Teacher/Admin views attendance dashboard with per-course %
```

---

## 🔐 API Overview

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/verify-otp` | Public |
| POST | `/api/auth/resend-otp` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/forgot-password` | Public |
| POST | `/api/auth/reset-password/:token` | Public |
| GET | `/api/auth/me` | Protected |
| PUT | `/api/auth/me` | Protected |
| POST | `/api/auth/avatar` | Protected |

### QR / Sessions
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/qr/create` | Teacher/Admin |
| GET | `/api/qr/sessions` | Teacher/Admin |
| GET | `/api/qr/sessions/:id` | Teacher/Admin |
| PATCH | `/api/qr/sessions/:id/deactivate` | Teacher/Admin |

### Attendance
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/attendance/mark` | Student |
| GET | `/api/attendance/session/:id` | Teacher/Admin |
| GET | `/api/attendance/my` | Student |

### Courses
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/courses` | Admin |
| GET | `/api/courses` | Admin |
| GET | `/api/courses/my` | Teacher/Admin |
| GET | `/api/courses/enrolled` | Student |
| GET | `/api/courses/:id` | Teacher/Admin/Student |
| GET | `/api/courses/:id/attendance` | Teacher/Admin |
| PUT | `/api/courses/:id` | Admin |
| PATCH | `/api/courses/:id/students` | Admin |
| DELETE | `/api/courses/:id/students/:studentId` | Admin |
| DELETE | `/api/courses/:id` | Admin |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/:id/role` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |
| GET | `/api/admin/sessions` | Admin |

---

## 🧠 Key Engineering Decisions

- **Haversine formula** used instead of a paid Maps API for distance calculation — zero cost, server-side, accurate enough for room/building-level geofencing.
- **UUID-based, time-bound QR codes** mean even a screenshotted QR can't be reused after the session window closes or is deactivated.
- **OTP at signup** prevents throwaway email abuse and ties each account to a real, verified email.
- **Distance logging on rejected attempts** creates an audit trail for disputed attendance claims.
- **Cloudinary** for avatar storage keeps MongoDB lean and serves images via CDN.
- **JWT + RBAC middleware** ensures admins, teachers, and students hit different endpoints and see different views, enforced server-side rather than trusted from the client.
- **Route ordering matters** — specific/named routes (`/enrolled`, `/my`) are registered before `/:id` param routes to avoid Express treating them as IDs.

---

## 🚀 Deployment

| Service | Platform |
|---|---|
| Backend API | Render |
| Frontend | Render Static Site / Vercel |
| Database | MongoDB Atlas |
| Media Storage | Cloudinary |

### Backend on Render
1. Push `backend/` to GitHub
2. New Web Service → connect repo
3. Build: `npm install`, Start: `npm start`
4. Add all env variables in the Render dashboard

### Frontend on Vercel
1. Push `frontend/` to GitHub
2. Import project on Vercel
3. Set `VITE_API_URL` to your deployed backend URL
4. Deploy

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

```bash
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

---

<div align="center">
  <sub>Built with ☕ and the genuine frustration of seeing attendance being faked in college.</sub>
</div>
