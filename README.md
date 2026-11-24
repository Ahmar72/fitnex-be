# Fitnex Backend (Nest.js + MongoDB)

High-performance, modular RESTful API backend for the **Fitnex** fitness and nutrition web platform, built with **Nest.js**, **MongoDB (Mongoose)**, **Swagger OpenAPI**, and **Nodemailer (Mailtrap)**.

---

## 🏗️ Architecture & Sequenced Folder Structure

```
fitnex-be/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts      # @CurrentUser() param decorator
│   │   │   └── public.decorator.ts            # @Public() decorator to bypass JWT guard
│   │   ├── dto/
│   │   │   ├── api-response.dto.ts            # Standard uniform ApiResponseDto & Swagger schemas
│   │   │   └── pagination.dto.ts              # Reusable PaginationQueryDto (page, limit)
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts       # Global uniform exception filter with logging
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts              # Global JWT authentication guard
│   │   └── interceptors/
│   │       ├── logging.interceptor.ts         # Request/response latency logger
│   │       └── transform.interceptor.ts       # Uniform { success, statusCode, message, data } wrapper
│   ├── config/
│   │   └── env.config.ts                      # Centralized typed environment loader with fallbacks
│   ├── database/
│   │   └── database.module.ts                 # Mongoose connection with lifecycle hooks & logging
│   ├── mail/
│   │   ├── dto/
│   │   │   └── send-email.dto.ts              # Transactional email input DTO
│   │   ├── mail.service.ts                    # Nodemailer + Mailtrap transporter & templates
│   │   └── mail.module.ts                     # MailModule exporting MailService
│   ├── modules/
│   │   ├── health/
│   │   │   ├── health.controller.ts           # Diagnostics, uptime, and MongoDB status
│   │   │   └── health.module.ts
│   │   ├── users/
│   │   │   ├── dto/                           # CreateUserDto & UpdateUserDto
│   │   │   ├── schemas/                       # Mongoose User schema with indexes & timestamps
│   │   │   ├── users.controller.ts            # User profile endpoints
│   │   │   ├── users.service.ts               # User repository & CRUD operations
│   │   │   └── users.module.ts
│   │   └── auth/
│   │       ├── dto/                           # Register, Login, Refresh, Password Reset DTOs
│   │       ├── strategies/                    # Passport JWT strategy
│   │       ├── auth.controller.ts             # Auth endpoints with Swagger route decorators
│   │       ├── auth.service.ts                # Auth business logic (JWT, bcrypt, Mailtrap trigger)
│   │       └── auth.module.ts                 # AuthModule wiring Users, Mail, Jwt, Passport
│   ├── app.module.ts                          # Root module orchestrating all feature modules
│   └── main.ts                                # Bootstrap with Swagger, validation, CORS, filters
├── .env.example                               # Environment template with Mailtrap & MongoDB keys
├── package.json                               # Dependencies and build scripts
└── tsconfig.json                              # TypeScript compiler options
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI
- **Mailtrap**: Free account at [mailtrap.io](https://mailtrap.io) for SMTP testing

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

```env
PORT=5000
API_PREFIX=api/v1
MONGODB_URI=mongodb://localhost:27017/fitnex

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_REFRESH_EXPIRATION=7d

MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_password
MAIL_FROM="Fitnex Team" <no-reply@fitnex.com>
```

### 4. Build and Run
```bash
# Build the application
npm run build

# Start in development watch mode
npm run start:dev

# Start in production mode
npm run start:prod
```

---

## 📖 Swagger Interactive Documentation
Once started, open your browser and navigate to:
**`http://localhost:5000/api/docs`**

Features interactive OpenAPI exploration, request/response schema models, and direct Bearer JWT token testing.

---

## 🔒 Implemented Phase 1 Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/health` | Health check & MongoDB connection status | ❌ (Public) |
| `POST` | `/api/v1/auth/register` | Register new user + welcome email | ❌ (Public) |
| `POST` | `/api/v1/auth/login` | Authenticate with credentials | ❌ (Public) |
| `POST` | `/api/v1/auth/refresh` | Refresh access token (Token rotation) | ❌ (Public) |
| `POST` | `/api/v1/auth/forgot-password` | Initiate password reset via Mailtrap | ❌ (Public) |
| `POST` | `/api/v1/auth/reset-password` | Reset password using email token | ❌ (Public) |
| `GET` | `/api/v1/auth/me` | Get authenticated user info | ✅ (Bearer JWT) |
| `POST` | `/api/v1/auth/logout` | Invalidate refresh token | ✅ (Bearer JWT) |
| `GET` | `/api/v1/users/profile` | Retrieve user profile details | ✅ (Bearer JWT) |
| `PATCH` | `/api/v1/users/profile` | Update profile (name, avatar, language) | ✅ (Bearer JWT) |

---

## 🛡️ Response Standards

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed on input data",
  "error": "Bad Request",
  "timestamp": "2026-11-24T12:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```
