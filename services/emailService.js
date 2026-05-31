const nodemailer = require('nodemailer');

let transporter;

const buildPasswordResetHtml = ({ name, resetUrl, expiryMinutes }) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
    <h2 style="color: #2563eb;">Password reset request</h2>
    <p>Hello ${name || 'there'},</p>
    <p>We received a request to reset your password. Use the link below to continue:</p>
    <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
    <p>Or copy this URL into your browser:</p>
    <p><code>${resetUrl}</code></p>
    <p>If you request another reset email, only the most recent link will remain valid.</p>
    <p>This link expires in ${expiryMinutes} minutes. If you did not request this change, you can safely ignore this message.</p>
  </div>
`;

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !Number.isInteger(port) || port <= 0 || !user || !pass || !from) {
    throw new Error(
      'SMTP is not fully configured. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, and SMTP_FROM.'
    );
  }

  const secureSetting = process.env.SMTP_SECURE;
  const secure = secureSetting ? secureSetting === 'true' : port === 465;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from,
  };
};

const getTransporter = () => {
  if (!transporter) {
    const smtpConfig = getSmtpConfig();
    transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return transporter;
};

const sendPasswordResetEmail = async ({ to, name, resetUrl, expiryMinutes }) => {
  const smtpConfig = getSmtpConfig();

  try {
    await getTransporter().sendMail({
      from: smtpConfig.from,
      to,
      subject: 'Reset your password',
      html: buildPasswordResetHtml({ name, resetUrl, expiryMinutes }),
    });
  } catch (err) {
    transporter = null; // reset so next request gets a fresh connection
    console.error('[emailService] sendMail failed:', {
      code: err.code || null,
      message: err.message,
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
    });
    throw err;
  }
};

const smtpHealthCheck = async () => {
  let smtpConfig;
  try {
    smtpConfig = getSmtpConfig();
  } catch (err) {
    return { ok: false, error: err.message };
  }

  try {
    await getTransporter().verify();
    return { ok: true, host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.secure };
  } catch (err) {
    transporter = null; // reset on verify failure
    return {
      ok: false,
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      code: err.code || null,
      error: err.message,
    };
  }
};

module.exports = { sendPasswordResetEmail, smtpHealthCheck };
