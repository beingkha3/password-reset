require('dotenv').config();

if (!process.env.MONGO_URI) {
  console.error('FATAL: MONGO_URI environment variable is required');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: clientOrigin,
  })
);
app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Password Reset API is running',
    endpoints: {
      forgotPassword: { method: 'POST', url: '/api/auth/forgot-password' },
      verifyResetLink: { method: 'GET', url: '/api/auth/reset-password/:token' },
      resetPassword: { method: 'POST', url: '/api/auth/reset-password/:token' },
    },
  });
});

app.use('/api/auth', authRoutes);

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
