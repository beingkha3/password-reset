const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed. Please try again.');
  }

  return data;
};

export const requestForgotPassword = (email) =>
  requestJson('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const verifyResetToken = (token) => requestJson(`/auth/reset-password/${token}`);

export const requestPasswordReset = (token, payload) =>
  requestJson(`/auth/reset-password/${token}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
