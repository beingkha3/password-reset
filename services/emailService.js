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

const getSender = () => {
  const from = process.env.SMTP_FROM || '';
  const match = from.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim() || 'Password Reset', email: match[2].trim() };
  }
  return { name: 'Password Reset', email: from.trim() || 'noreply@kazrotech.com' };
};

const brevoPost = async (path, payload) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not configured');

  return fetch(`https://api.brevo.com/v3${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};

const brevoGet = async (path) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not configured');

  return fetch(`https://api.brevo.com/v3${path}`, {
    headers: { accept: 'application/json', 'api-key': apiKey },
  });
};

const sendPasswordResetEmail = async ({ to, name, resetUrl, expiryMinutes }) => {
  const res = await brevoPost('/smtp/email', {
    sender: getSender(),
    to: [{ email: to, name: name || to }],
    subject: 'Reset your password',
    htmlContent: buildPasswordResetHtml({ name, resetUrl, expiryMinutes }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[emailService] Brevo send failed:', { status: res.status, body });
    throw new Error(`Email delivery failed (Brevo ${res.status}): ${body}`);
  }
};

const smtpHealthCheck = async () => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: 'BREVO_API_KEY is not configured' };

  try {
    const res = await brevoGet('/account');
    if (res.ok) {
      const data = await res.json();
      return { ok: true, provider: 'brevo', account: data.email };
    }
    const body = await res.text();
    return { ok: false, provider: 'brevo', status: res.status, error: body };
  } catch (err) {
    return { ok: false, provider: 'brevo', error: err.message };
  }
};

module.exports = { sendPasswordResetEmail, smtpHealthCheck };
