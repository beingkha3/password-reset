const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  forgotPassword,
  resetPassword,
  verifyResetToken,
  register,
  login,
  getCurrentUser,
} = require('../controllers/authController');
const { handleErrors, forgotPasswordRules, loginRules, resetPasswordRules, registerRules } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many sign-in attempts. Please try again in 15 minutes.' },
});

router.post('/register', registerRules, handleErrors, register);
router.post('/login', loginLimiter, loginRules, handleErrors, login);
router.get('/me', requireAuth, getCurrentUser);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordRules, handleErrors, forgotPassword);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password/:token', resetPasswordRules, handleErrors, resetPassword);

module.exports = router;
