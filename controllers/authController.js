const { createPasswordResetToken, hashResetToken } = require('../utils/resetToken');
const { sendPasswordResetEmail } = require('../services/emailService');
const User = require('../models/User');

const resetExpiryMinutes = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES || 15);
const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(
  /\/$/,
  ''
);

const getResetUser = async (token) => {
  const tokenHash = hashResetToken(token);

  return User.findOne({ passwordResetTokenHash: tokenHash }).select(
    '+passwordResetTokenHash +passwordResetExpiresAt +password +name +email'
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    const { token, tokenHash, expiresAt } = createPasswordResetToken(resetExpiryMinutes);
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    let previewUrl;
    try {
      const result = await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiryMinutes: resetExpiryMinutes,
      });
      previewUrl = result.previewUrl;
    } catch (err) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });
      throw err;
    }

    return res.json({
      success: true,
      message: 'Password reset link sent to your email.',
      ...(previewUrl && { previewUrl }),
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyResetToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    const user = await getResetUser(token);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid reset link' });
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({
        success: false,
        message: 'Reset link has expired. Please request a new one.',
      });
    }

    return res.json({
      success: true,
      message: 'Reset link is valid',
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const token = req.params.token;
    const { password } = req.body;
    const user = await getResetUser(token);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid reset link' });
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({
        success: false,
        message: 'Reset link has expired. Please request a new one.',
      });
    }

    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successfully. Redirecting to login.',
    });
  } catch (err) {
    next(err);
  }
};
