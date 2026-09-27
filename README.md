# College Portal Security Assessment Application

## Project Description

A controlled mock college portal and a separate future security-assessment component for studying authentication, session-management, and authorization. Assessment activity is restricted to this project's own local application. Phase 2 establishes a secure authentication baseline; it does not add intentional vulnerabilities or a scanner.

## Problem Statement and Objectives

Authentication and session-management mistakes can expose student information and privileged portal functions. This project provides a controlled environment to compare a secure implementation with carefully introduced test cases in a later phase, record evidence, apply fixes, and re-test.

- Keep portal, database, and future security-assessment logic modular.
- Establish a secure authentication and role-authorization baseline.
- In later phases, test only the local mock portal and document findings.
- Fix findings and re-test to demonstrate the secure result.

## Technology Stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Authentication: bcrypt, JWT, HTTP-only cookies
- Development: VS Code, Git, GitHub, MongoDB Compass
- Testing: Node.js test runner, Supertest, Postman, Chrome DevTools; OWASP ZAP is planned later

## Planned Roles

- `student`: student portal resources
- `admin`: admin portal resources
- `security_assessor`: security assessment resources only

Public registration always assigns `student`; administrative roles are provisioned only through the development seed or another trusted administrative process.

## High-Level Architecture

```text
React/Vite client -> Express JSON API -> Mongoose models -> MongoDB
                         |
                         +-> auth and exact-role middleware

Future assessment component -> this project's local mock portal only
```

The client and server are npm workspaces. Auth controllers/routes, middleware, security settings, models, and database configuration are separate modules. Future assessment logic remains separate from portal logic.

## Authentication Architecture

### Password Handling

Registration normalizes email and hashes the password with bcrypt cost factor 12 before persistence. The User schema hides the password field from ordinary queries and validates that stored values have bcrypt hash format. API responses are built from an explicit safe-user projection, never from the full database document.

### JWT and Cookie Flow

1. Login normalizes the submitted email, finds the user, and uses `bcrypt.compare()`; all credential failures return `Invalid email or password.`
2. On success, the server signs a 15-minute HS256 JWT containing only the subject (user ID), role claim, and token version.
3. The JWT is set in the `college_portal_auth` cookie. It is never returned in JSON or stored in browser JavaScript storage.
4. The authentication middleware verifies the signature and expiration, loads the user from MongoDB, checks the token version, and derives the current role from that database record.
5. Logout increments the user's token version and clears the cookie, so replaying the old cookie is rejected as well.

Cookie attributes: `httpOnly` prevents JavaScript access; `secure` is enabled in production and off for local HTTP development; `sameSite=lax` limits cross-site cookie sending while supporting same-site local frontend/API requests; `path=/` makes the cookie available to API routes; the 15-minute `maxAge` matches JWT expiry. Cookie clearing uses the same path and security attributes.

The frontend includes credentials on API requests. CORS allows only `CLIENT_URL` and enables credentials; it does not combine credentials with a wildcard origin. Frontend route guards improve navigation only; all protected APIs enforce authentication and roles independently.

## API Endpoints

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/health` | Public health check |
| `POST` | `/api/auth/register` | Public; always creates a student |
| `POST` | `/api/auth/login` | Public; sets HTTP-only cookie |
| `GET` | `/api/auth/me` | Authenticated; returns safe current user |
| `POST` | `/api/auth/logout` | Public/idempotent; revokes cookie token and clears cookie |
| `GET` | `/api/students/dashboard` | Student only |
| `GET` | `/api/admin/dashboard` | Admin only |
| `GET` | `/api/security/dashboard` | Security assessor only |

Errors use `{ "success": false, "message": "..." }`. Password hashes and JWTs are not included in responses.

## Configure MongoDB and Environment

Prerequisites: Node.js 20 or later, npm, and a running local MongoDB or a MongoDB connection string. The API fails at startup with a sanitized message if MongoDB is missing or unavailable.

Copy `server/.env.example` to `server/.env`, then set `MONGODB_URI` and a unique random `JWT_SECRET` of at least 32 bytes. Generate a secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Environment variables:

| Variable | Purpose | Default/requirement |
| --- | --- | --- |
| `PORT` | Express port | `5000` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required; at least 32 bytes |
| `CLIENT_URL` | Exact allowed CORS origin | `http://localhost:5173` |
| `NODE_ENV` | Environment and cookie `secure` setting | Use `development` locally; `production` enables Secure cookies |

The frontend optionally accepts `VITE_API_URL` at build time; otherwise it calls `http://localhost:5000`.

Never commit `.env` or use the documented development passwords outside a local throwaway database.

## Development Seed Accounts

The seed command refuses to run unless `NODE_ENV=development` is explicitly set. It creates only fake development users, hashes their passwords, and assigns the fixed roles below. It is not an authentication bypass or a production account mechanism.

| Role | Email | Development password |
| --- | --- | --- |
| Student | `student@example.com` | `StudentDev!2026` |
| Admin | `admin@example.com` | `AdminDev!2026` |
| Security assessor | `security@example.com` | `SecurityDev!2026` |

PowerShell:

```powershell
$env:NODE_ENV = 'development'
npm run seed:dev --workspace server
```

macOS/Linux:

```sh
NODE_ENV=development npm run seed:dev --workspace server
```

## Run the Application

Install packages once from the project root:

```sh
npm install
```

Configure `server/.env`, then start the backend and frontend in separate terminals:

```sh
npm run dev:server
npm run dev:client
```

The frontend is normally at `http://localhost:5173`; the API is at `http://localhost:5000`. `GET http://localhost:5000/api/health` checks the server after a successful database connection.

## Test with Postman

1. Start MongoDB and the backend, then optionally seed the local development accounts.
2. Send `POST http://localhost:5000/api/auth/login` with JSON `{ "email": "student@example.com", "password": "StudentDev!2026" }`. Keep Postman's cookie jar enabled; the response JSON contains the user but not the JWT.
3. Send `GET /api/auth/me` and `GET /api/students/dashboard` to confirm the cookie is sent.
4. Send `GET /api/admin/dashboard` with the student cookie; it should return `403`. Without a cookie, protected resources return `401`.
5. Send `POST /api/auth/logout`, then repeat a protected request; it should return `401`. The server also revokes the prior token version.

Registration accepts `name`, `email`, `password` (minimum 12 characters), and `studentId`. Any supplied `role` is ignored and public registrations are students.

## Development Phases

1. Project foundation and architecture (complete)
2. Secure authentication and authorization baseline (complete)
3. Controlled vulnerabilities and scoped security tests (not started; requires a separate instruction)
4. Findings, remediation, and re-testing
5. Secure-result demonstration and documentation

No intentional vulnerabilities, IDOR behavior, or scanner are part of the current implementation.