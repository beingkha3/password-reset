const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const REQUEST_TIMEOUT_MS = 20000;

const getAuthToken = () => {
  try {
    return window.localStorage.getItem('pr_auth_token');
  } catch {
    return null;
  }
};

const buildHeaders = (extra) => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
};

const requestJson = async (path, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: buildHeaders(options.headers),
      ...options,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed. Please try again.');
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The request timed out. Please try again.', { cause: err });
    }

    if (err instanceof TypeError) {
      throw new Error('Unable to reach the server. Please try again.', { cause: err });
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const registerUser = (name, email, password) =>
  requestJson('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });

export const loginUser = (email, password) =>
  requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getCurrentUser = () => requestJson('/auth/me');

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
