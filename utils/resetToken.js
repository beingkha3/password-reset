const crypto = require('crypto');

const createPasswordResetToken = (expiryMinutes = 15) => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  return { token, tokenHash, expiresAt };
};

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { createPasswordResetToken, hashResetToken };
