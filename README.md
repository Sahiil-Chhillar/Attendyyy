# Attendyy — QR-Based Attendance Management System

A full-stack attendance system with dynamic QR codes, geolocation verification, OTP email auth, Cloudinary media, and role-based access control.

## Tech Stack
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Nodemailer, Cloudinary, QRCode
- **Frontend:** React 18, Vite, React Router v6, Axios, react-hot-toast, jsQR

## Roles
| Role | Capabilities |
|------|-------------|
| **Student** | Register, verify email, scan QR, view own attendance history |
| **Teacher** | Create sessions with dynamic QR + geolocation radius, view session attendance |
| **Admin** | Manage all users/roles, view all sessions, dashboard stats |

## Project Structure
```
attendyy/
├── backend/      # Express REST API
└── frontend/     # React + Vite SPA
```

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, EMAIL_*, CLOUDINARY_* in .env
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

Open `http://localhost:3000`

## Environment Variables

### Backend `.env`
| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | Token expiry e.g. `7d` |
| `EMAIL_HOST` | SMTP host e.g. `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port e.g. `587` |
| `EMAIL_USER` | Your Gmail address |
| `EMAIL_PASS` | Gmail App Password |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLIENT_URL` | Frontend URL e.g. `http://localhost:3000` |

### Frontend `.env`
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

## API Endpoints

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

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/:id/role` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |
| GET | `/api/admin/sessions` | Admin |

## Key Features
- **Dynamic QR codes** — UUID token per session, expire after configurable duration
- **Haversine geolocation** — verifies student is physically within the configured radius
- **Proxy prevention** — distance logged even for rejected attempts
- **OTP email verification** — 6-digit OTP with 10-minute expiry
- **Secure password reset** — SHA-256 hashed token, 15-minute expiry
- **RBAC middleware** — role-checked on every protected route
- **Cloudinary avatars** — auto-resized to 300×300
- **MVC architecture** — controllers / routes / models / middleware cleanly separated

## Deployment (Render + Vercel)

### Backend on Render
1. Push `backend/` to GitHub
2. New Web Service → connect repo
3. Build: `npm install`, Start: `npm start`
4. Add all env variables in Render dashboard

### Frontend on Vercel
1. Push `frontend/` to GitHub
2. Import project on Vercel
3. Set `VITE_API_URL` to your Render backend URL
4. Deploy
