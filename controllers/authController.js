const { createPasswordResetToken, hashResetToken } = require('../utils/resetToken');
const { sendPasswordResetEmail } = require('../services/emailService');
const { signAuthToken } = require('../utils/jwt');
const User = require('../models/User');

const resetExpiryMinutes = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES || 15);
const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(
  /\/$/,
  ''
);

const testEndpointsEnabled = () => process.env.ENABLE_TEST_ENDPOINTS === 'true';
const latestResetTokens = new Map();

const getResetUser = async (token) => {
  const tokenHash = hashResetToken(token);

  return User.findOne({ passwordResetTokenHash: tokenHash }).select(
    '+passwordResetTokenHash +passwordResetExpiresAt +password +name +email'
  );
};

const buildAuthResponse = (user) => {
  const token = signAuthToken({ sub: user._id.toString(), email: user.email });
  return {
    success: true,
    message: 'Signed in successfully.',
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email },
    },
  };
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

exports.login = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    return res.json(buildAuthResponse(user));
  } catch (err) {
    next(err);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists. Please sign in again.',
      });
    }

    return res.json({
      success: true,
      data: { user: { id: user._id, name: user.name, email: user.email } },
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

    if (testEndpointsEnabled()) {
      latestResetTokens.set(email, { token, expiresAt });
    }

    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiryMinutes: resetExpiryMinutes,
      });
    } catch (err) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });
      throw err;
    }

    return res.json({
      success: true,
      message: 'Password reset link sent to your email.',
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

exports.getLatestResetToken = async (req, res, next) => {
  try {
    if (!testEndpointsEnabled()) {
      return res.status(404).json({
        success: false,
        message: 'Not found',
      });
    }

    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'email query parameter is required',
      });
    }

    const entry = latestResetTokens.get(email);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'No active reset token for this email. Run Forgot Password first.',
      });
    }

    if (entry.expiresAt.getTime() < Date.now()) {
      latestResetTokens.delete(email);
      return res.status(410).json({
        success: false,
        message: 'Latest reset token has expired. Request a new one.',
      });
    }

    return res.json({
      success: true,
      data: { token: entry.token, expiresAt: entry.expiresAt.toISOString() },
    });
  } catch (err) {
    next(err);
  }
};
