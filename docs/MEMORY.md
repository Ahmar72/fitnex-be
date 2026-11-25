# Fitnex — Living Project Memory & Status (MEMORY.md)

**Last Updated:** November 25, 2026  
**Environment:** Windows (Local Development)  
**Database:** MongoDB 7 (Port 27017, Service Active)  
**Backend:** NestJS 11 (Port 5000, Background Daemon)  
**Frontend:** React 18 + Vite (Port 5173, Background Daemon)

---

## 1. Active Infrastructure & URLs

| Component | URL | Notes |
| :--- | :--- | :--- |
| **Frontend Application** | `http://localhost:5173` | Reverse proxy `/api` forwards to backend port 5000 |
| **Backend REST API** | `http://localhost:5000/api/v1` | All routes prefixed with `/api/v1` |
| **OpenAPI / Swagger** | `http://localhost:5000/api/docs` | Interactive API documentation |
| **MongoDB Service** | `mongodb://localhost:27017/fitnex` | Running locally as Windows service (PID 4372) |

---

## 2. Test Execution & Health History

| Suite | Scope | Result | Date |
| :--- | :--- | :--- | :--- |
| **Auth & Security** | Registration, login, OTP verification, password recovery, token revocation, role escalation defense | **16/16 Passed** | Nov 24, 2026 |
| **Exercises Catalog** | 1,324 movements pagination, keyword search, taxonomy filters, cached facets, multi-lingual steps, favorites | **31/31 Passed** | Nov 24, 2026 |
| **Workouts & Plans** | Builder draft sync, routine loading, 9 plan schedules, program enrollment, continuous progression, cancellation | **52/52 Passed** | Nov 25, 2026 |

---

## 3. Git Repository Tracking

- **Backend Repository:** `https://github.com/Ahmar72/fitnex-be.git` (Branch: `main`)
  - Latest Commit: `c74ff70` ("Register Workouts and Plans modules in root application")
  - Clean working directory, all changes pushed.
- **Frontend Repository:** `https://github.com/Ahmar72/fitnex-fe.git` (Branch: `main`)
  - Latest Commit: `6ed79eb` ("Add email verification, forgot password, and reset password views")
  - Clean working directory, all changes pushed.

---

## 4. Key Configurations & Environment

- **Mailtrap SMTP Sandbox:**
  - Host: `sandbox.smtp.mailtrap.io`
  - Port: `2525`
  - Auth: Credentials configured in `.env` (Never commit `.env` to Git).
- **Security Protocols:**
  - JWT Access Secret configured with 15-minute expiration.
  - JWT Refresh Secret configured with 7-day rotation.
  - Sensitive user fields guarded with `select: false`.
