const nodemailer = require('nodemailer');

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
  const transport = process.env.EMAIL_TRANSPORT;

  // Demo / Ethereal mode — skip SMTP entirely.
  // Return the reset URL directly so the frontend can surface it as a clickable link.
  // Render and similar hosts block outbound SMTP; this avoids that dependency completely.
  if (transport === 'ethereal') {
    console.log(`[ethereal] Password reset link for ${to}: ${resetUrl}`);
    return { previewUrl: resetUrl };
  }

  // Console mode — log and return; no delivery attempted.
  if (transport === 'console') {
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'unix',
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to,
      subject: 'Reset your password',
      html: buildPasswordResetHtml({ name, resetUrl, expiryMinutes }),
    });
    console.log(`[console] Password reset link for ${to}: ${resetUrl}`);
    return {};
  }

  // SMTP mode — real delivery.
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error(
      'Email transport is not configured. Set EMAIL_TRANSPORT=ethereal for development or provide SMTP credentials.'
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    greetingTimeout: 10000,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject: 'Reset your password',
    html: buildPasswordResetHtml({ name, resetUrl, expiryMinutes }),
  });

  return {};
};

module.exports = { sendPasswordResetEmail };
