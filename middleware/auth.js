const { verifyAuthToken } = require('../utils/jwt');

const extractToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
};

const requireAuth = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.',
    });
  }

  try {
    const decoded = verifyAuthToken(token);
    req.user = { id: decoded.sub, email: decoded.email };
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please sign in again.',
    });
  }
};

module.exports = { requireAuth };
