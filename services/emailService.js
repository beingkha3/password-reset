const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.EMAIL_TRANSPORT === 'console') {
    return nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'unix',
    });
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error(
      'Email transport is not configured. Set EMAIL_TRANSPORT=console for local development or provide SMTP credentials.'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
};

const buildPasswordResetHtml = ({ name, resetUrl, expiryMinutes }) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
    <h2 style="color: #2563eb;">Password reset request</h2>
    <p>Hello ${name || 'there'},</p>
    <p>We received a request to reset your password. Use the link below to continue:</p>
    <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
    <p>Or copy this URL into your browser:</p>
    <p><code>${resetUrl}</code></p>
    <p>This link expires in ${expiryMinutes} minutes. If you did not request this change, you can safely ignore this message.</p>
  </div>
`;

const sendPasswordResetEmail = async ({ to, name, resetUrl, expiryMinutes }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject: 'Reset your password',
    html: buildPasswordResetHtml({ name, resetUrl, expiryMinutes }),
  });

  if (process.env.EMAIL_TRANSPORT === 'console') {
    console.log(`Password reset email prepared for ${to}: ${resetUrl}`);
  }

  return info;
};

module.exports = { sendPasswordResetEmail };
