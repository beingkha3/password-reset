const buildPasswordResetHtml = ({ name, resetUrl, expiryMinutes }) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr>
          <td style="background-color:#2563eb;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">KazroTech</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hello ${name || 'there'},</p>
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
              We received a request to reset the password for your account. Click the button below to choose a new password.
            </p>

            <!-- Button -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background-color:#2563eb;border-radius:8px;">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">
                    Reset my password
                  </a>
                </td>
              </tr>
            </table>

            <!-- URL fallback -->
            <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Button not working? Copy and paste this link into your browser:</p>
            <p style="margin:0 0 32px;font-size:12px;word-break:break-all;color:#2563eb;">${resetUrl}</p>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">

            <!-- Notes -->
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:0 0 10px;">
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                    <strong style="color:#374151;">Expires in ${expiryMinutes} minutes.</strong>
                    After that, you will need to request a new link.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 0 10px;">
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                    <strong style="color:#374151;">Only the most recent link is valid.</strong>
                    If you requested multiple reset emails, use the latest one.
                  </p>
                </td>
              </tr>
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                    <strong style="color:#374151;">Did not request this?</strong>
                    You can safely ignore this email &mdash; your password will not change.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f9fafb;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              This is an automated message from KazroTech. Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
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
