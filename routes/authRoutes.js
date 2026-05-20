const express = require('express');
const rateLimit = require('express-rate-limit');
const { forgotPassword, resetPassword, verifyResetToken, register } = require('../controllers/authController');
const { handleErrors, forgotPasswordRules, resetPasswordRules, registerRules } = require('../middleware/validate');

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});

router.post('/register', registerRules, handleErrors, register);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordRules, handleErrors, forgotPassword);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password/:token', resetPasswordRules, handleErrors, resetPassword);

module.exports = router;
