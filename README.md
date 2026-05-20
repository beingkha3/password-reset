# Password Reset

This is a project I built while learning MERN stack development. It implements a complete "Forgot Password" flow — the kind you see on almost every real website, where a user can request a password reset link by email and then securely set a new password.

I learned a lot building this. It covers backend security concepts I had never touched before, like hashing tokens, expiring links, and making sure a reset link can only be used once.

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
- Setting up nodemailer to send emails (and using a `console` mode during development so I don't need real SMTP)
- Writing Express middleware for input validation using `express-validator`
- Rate limiting with `express-rate-limit` to prevent someone from spamming the forgot-password endpoint
- Connecting React frontend to an Express backend with environment variables
- Deploying a full-stack app — separate services for backend (Render Web Service) and frontend (Render Static Site)

---

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- bcryptjs (password hashing)
- nodemailer (emails)
- express-validator (input validation)
- express-rate-limit (brute-force protection)

**Frontend**
- React + Vite
- React Router
- Bootstrap 5 + Bootstrap Icons (installed via npm, not CDN)

---

## Project Structure

```
password-reset/
├── server.js                   # Main Express server
├── package.json
├── .env.example                # Copy this to .env and fill in your values
├── config/
│   └── db.js                   # MongoDB connection
├── models/
│   └── User.js                 # User schema with bcrypt password hashing
├── controllers/
│   └── authController.js       # All the auth logic
├── routes/
│   └── authRoutes.js           # API routes with rate limiting
├── services/
│   └── emailService.js         # Nodemailer setup (console or SMTP)
├── utils/
│   └── resetToken.js           # Token generation and SHA-256 hashing
├── middleware/
│   ├── errorHandler.js         # Global error handler
│   └── validate.js             # express-validator rules
├── postman_collection.json     # Ready-to-import Postman collection
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

Open `.env` and fill in your MongoDB connection string. For local development, leave `EMAIL_TRANSPORT=console` — this makes the reset link print to your terminal instead of sending a real email.

```bash
npm start
```

The API runs on `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

### 4. Testing the flow

The easiest way is to use the included Postman collection:

1. Import `postman_collection.json` into Postman
2. Set `{{base_url}}` to `http://localhost:5000`
3. Run **Register** to create a test user
4. Run **Forgot Password** with that email — copy the reset link from the server terminal
5. Paste the token from the link into `{{reset_token}}`
6. Run **Verify Reset Token** to confirm it works
7. Run **Reset Password** to set a new password

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

---

## Deploying to Render

This project is set up to deploy as two separate services on [Render](https://render.com).

### Backend — Web Service

| Setting | Value |
|---------|-------|
| Root Directory | `password-reset` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Environment variables to add in the Render dashboard:

```
MONGO_URI=your_mongodb_atlas_connection_string
CLIENT_ORIGIN=https://your-frontend.onrender.com
EMAIL_TRANSPORT=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend — Static Site

| Setting | Value |
|---------|-------|
| Root Directory | `password-reset/client` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Environment variable to add (must be set **before** the build runs):

```
VITE_API_URL=https://your-backend.onrender.com/api
```

> **Note:** In MongoDB Atlas, go to Network Access and add `0.0.0.0/0` to allow connections from Render's servers (Render uses dynamic IPs).
