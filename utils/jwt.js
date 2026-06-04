const jwt = require('jsonwebtoken');

const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '1d';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

const signAuthToken = (payload) => {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_EXPIRY });
};

const verifyAuthToken = (token) => {
  return jwt.verify(token, getSecret());
};

module.exports = { signAuthToken, verifyAuthToken };
