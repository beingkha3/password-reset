const TOKEN_KEY = 'pr_auth_token';
const USER_KEY = 'pr_auth_user';

const readStorage = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    if (value == null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    /* storage unavailable (private mode, SSR, etc.) — silently ignore */
  }
};

export const getToken = () => readStorage(TOKEN_KEY);

export const getStoredUser = () => {
  const raw = readStorage(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    writeStorage(USER_KEY, null);
    return null;
  }
};

export const setSession = ({ token, user }) => {
  writeStorage(TOKEN_KEY, token);
  writeStorage(USER_KEY, JSON.stringify(user));
};

export const signOut = () => {
  writeStorage(TOKEN_KEY, null);
  writeStorage(USER_KEY, null);
};
