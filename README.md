# Password Reset — MERN Stack Project

This is a project I built while learning MERN stack development. It implements a complete "Forgot Password" flow — the kind you see on almost every real website, where a user can request a password reset link by email and then securely set a new password.

I learned a lot building this. It covers backend security concepts I had never touched before, like hashing tokens, expiring links, and making sure a reset link can only be used once.

**Live demo:**
- Frontend: https://password-reset-iuuq.onrender.com
- Backend API: https://password-reset-xlp6.onrender.com

---

## What This Project Does

The full flow works like this:

1. User goes to the Forgot Password page and types their email
2. The server generates a random token, hashes it, and saves the hash to the database
3. A reset link containing the raw token is sent to the user's email
4. User clicks the link — the frontend calls the API to check if the token is valid and not expired
5. If valid, the user sees a form to set a new password
6. On success, the token is deleted from the database so the link can never be used again

---

## Things I Learned Building This

- How to use `crypto.randomBytes` to generate a secure random token
- Why you should store a **hash** of the token in the database, not the token itself (same idea as hashing passwords)
- How token expiry works — storing an expiry timestamp and comparing it on each request
- Setting up nodemailer to send real SMTP emails from a domain mailbox
- Writing Express middleware for input validation using `express-validator`
- Rate limiting with `express-rate-limit` to prevent someone from spamming the forgot-password endpoint
- Connecting React frontend to an Express backend with environment variables
- Deploying a full-stack app — separate services for backend (Render Web Service) and frontend (Render Static Site)
- Configuring `trust proxy` on Express so rate limiting works correctly behind Render's proxy layer

---

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB Atlas + Mongoose
- bcryptjs (password hashing)
- nodemailer (emails)
- express-validator (input validation)
- express-rate-limit (brute-force protection)

**Frontend**
- React + Vite
- React Router
- Bootstrap 5 + Bootstrap Icons (installed via npm, not CDN)

**Deployed on**
- Render (backend as Web Service, frontend as Static Site)
- MongoDB Atlas (database)

---

## Project Structure

```
password-reset/
├── server.js                   # Main Express server
├── package.json
├── .env.example                # Copy this to .env and fill in your MongoDB + SMTP values
├── config/
│   └── db.js                   # MongoDB connection
├── models/
│   └── User.js                 # User schema with bcrypt password hashing
├── controllers/
│   └── authController.js       # All the auth logic
├── routes/
│   └── authRoutes.js           # API routes with rate limiting
├── services/
│   └── emailService.js         # Nodemailer SMTP setup
├── utils/
│   └── resetToken.js           # Token generation and SHA-256 hashing
├── middleware/
│   ├── errorHandler.js         # Global error handler
│   └── validate.js             # express-validator rules
├── password-reset.postman_collection.json   # Ready-to-import Postman collection
├── password-reset.postman_environment.json # Postman environment (production base_url)
└── client/                     # React frontend
    ├── package.json
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── api/
        │   └── passwordResetApi.js   # All fetch calls to the backend
        ├── components/
        │   ├── AuthFrame.jsx         # Shared page layout
        │   ├── SiteNavbar.jsx
        │   └── StatusAlert.jsx
        └── pages/
            ├── ForgotPasswordPage.jsx
            ├── ResetPasswordPage.jsx
            └── LoginPage.jsx
```

---

## API Endpoints

| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | `/api/auth/register` | Create a new user |
| POST | `/api/auth/forgot-password` | Send a reset link (rate limited to 5 requests per 15 min) |
| GET | `/api/auth/reset-password/:token` | Check if a token is valid and not expired |
| POST | `/api/auth/reset-password/:token` | Save the new password, delete the token |

---

## Frontend Pages

| URL | What it shows |
|-----|---------------|
| `/forgot-password` | Email input form |
| `/reset-password/:token` | Checks token, then shows new password form |
| `/login` | Confirmation screen after a successful reset |

---

## How to Run It Locally

### 1. Clone the repo

```bash
git clone https://github.com/beingkha3/password-reset.git
cd password-reset
```

### 2. Set up the backend

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in your MongoDB connection string and your SMTP mailbox settings. The server now validates the SMTP connection during startup, so it will fail fast if the mail configuration is incomplete or incorrect.

```bash
npm start
```

The API runs on `http://localhost:5000`.

### 3. Set up the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

### 4. Testing the flow locally

1. Start the backend and confirm it connects to MongoDB and starts without SMTP errors.
2. Register a user with an email address you can access.
3. Submit that email on `/forgot-password`.
4. Open the password reset email delivered to your inbox.
5. Click the reset link and complete the password update.

---

## Testing with Postman

A ready-to-use collection is published here:  
https://www.postman.com/beingkha3-2637696/password-reset/collection/z2gaak9/password-reset?action=share&creator=54783568&active-environment=54783568-ba0d9c98-ac1e-46a2-854a-4354d4de72cc

The collection file is also committed to this repo as `password-reset.postman_collection.json` (with `password-reset.postman_environment.json`).
The workspace includes a **`password-reset (production)`** environment with `{{base_url}}` already pointed at the live backend. Set `test_email` in that environment to an inbox you can access, then select it from the environment dropdown in the top-right of Postman before running requests.

**Run requests in this order:**

1. **Register** — creates a test account (safe to re-run; returns 409 if already registered)
2. **Forgot Password** — triggers the reset link email
3. **Forgot Password - Unknown Email (404)** — confirms unregistered emails return 404 (optional)
4. Copy the token from the reset email link into the collection variable `resetToken`
5. **Verify Reset Token** — confirms the token is valid
6. **Reset Password** — submits the new password; token is invalidated server-side
7. **Reset Password - Reuse Token (400)** — confirms the same token cannot be used again

---

## Password Requirements

The new password must have:
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (e.g. `!@#$%`)

The frontend shows a live checklist as you type.

---

## Security Notes

I tried to follow real-world security practices here, not just make it work:

- The database **never stores the raw token** — only a SHA-256 hash of it. If the database was leaked, the tokens would be useless.
- Tokens expire after **15 minutes**.
- After a successful reset, the token is **deleted immediately** so the same link cannot be used twice.
- The forgot-password endpoint is **rate limited** to stop someone from flooding it.
- Passwords are hashed with **bcryptjs at cost factor 12** before saving.
- Express `trust proxy` is enabled so rate limiting works correctly behind Render's reverse proxy.

---

## Deploying to Render

This project is deployed as two separate services on [Render](https://render.com).

### Backend — Web Service

| Setting | Value |
|---------|-------|
| Root Directory | *(leave blank — repo root is the backend)* |
| Build Command | `npm install` |
| Start Command | `npm start` |

Environment variables to set in the Render dashboard:

```
MONGO_URI=your_mongodb_atlas_connection_string
FRONTEND_URL=https://your-frontend.onrender.com
SMTP_HOST=your_smtp_host
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@yourdomain.com
SMTP_PASS=your_email_password
SMTP_FROM=Password Reset <your_email@yourdomain.com>
RESET_TOKEN_EXPIRY_MINUTES=15
```

> Port 465 requires `SMTP_SECURE=true`. Port 587 requires `SMTP_SECURE=false`.

### Frontend — Static Site

| Setting | Value |
|---------|-------|
| Root Directory | `client` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Environment variable to set (must be added **before** the build runs, not after):

```
VITE_API_URL=https://your-backend.onrender.com/api
```

> In MongoDB Atlas, go to **Network Access** and add `0.0.0.0/0` to allow connections from Render's dynamic IPs.
