import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, loginUser } from '../api/passwordResetApi';
import AuthFrame from '../components/AuthFrame';
import StatusAlert from '../components/StatusAlert';
import { getStoredUser, getToken, setSession, signOut } from '../utils/auth';

const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value.trim());

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = location.state && typeof location.state === 'object' ? location.state : null;
  const noticeFromReset = fromState?.resetSuccess;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(noticeFromReset ? 'Your password was reset successfully. Please sign in with your new password.' : '');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(Boolean(getToken()));
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    let mounted = true;
    const token = getToken();

    if (!token) {
      return () => {
        mounted = false;
      };
    }

    getCurrentUser()
      .then((response) => {
        if (!mounted) return;
        setUser(response.data.user);
      })
      .catch(() => {
        if (!mounted) return;
        signOut();
        setUser(null);
      })
      .finally(() => {
        if (mounted) setRestoring(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const trimmedEmail = email.trim();
  const emailIsValid = isValidEmail(trimmedEmail);
  const canSubmit = emailIsValid && password.length > 0 && !loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!emailIsValid) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(trimmedEmail, password);
      setSession({ token: response.data.token, user: response.data.user });
      setUser(response.data.user);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    setEmail('');
    setPassword('');
    setError('');
    setInfo('You have been signed out.');
  };

  const handleGoToReset = () => {
    navigate('/forgot-password');
  };

  if (restoring) {
    return (
      <AuthFrame
        badge="Sign in"
        title="Checking your session"
        subtitle="Verifying that your sign-in token is still valid."
      >
        <section className="state-panel text-center" aria-live="polite">
          <div className="spinner-border text-secondary mb-3" role="status" aria-hidden="true" />
          <h2>Restoring session...</h2>
          <p>One moment while we confirm your account.</p>
        </section>
      </AuthFrame>
    );
  }

  if (user) {
    const firstName = (user.name || '').trim().split(/\s+/)[0] || user.email;
    return (
      <AuthFrame
        badge="Signed in"
        title={`Welcome back, ${firstName}`}
        subtitle="Your session is active. You can sign out below or test the password reset flow."
      >
        <section className="state-panel text-center" aria-live="polite">
          <div className="state-icon success">
            <i className="bi bi-shield-check" />
          </div>
          <h2>You are signed in</h2>
          <p>
            Signed in as <strong>{user.name || user.email}</strong>
            {user.name ? ` (${user.email})` : ''}.
          </p>
          <div className="action-stack">
            <button type="button" className="btn btn-dark w-100" onClick={handleGoToReset}>
              Test password reset flow
            </button>
            <button type="button" className="btn btn-outline-secondary w-100" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </section>
        <div className="form-footer">
          <Link to="/register">Need a new account? Register</Link>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      badge="Sign in"
      title="Return to your account"
      subtitle="Enter the email and password you registered with to access your account."
    >
      <div className="form-header">
        <h2>Sign in</h2>
        <p>Use your registered email and password to continue.</p>
      </div>

      <StatusAlert variant="success" message={info} />
      <StatusAlert variant="danger" message={error} />

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="login-email" className="form-label">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            className="form-control"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="login-password" className="form-label">
            Password
          </label>
          <div className="password-field">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-dark w-100" disabled={!canSubmit}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="form-footer">
        <Link to="/forgot-password">Forgot password?</Link>
        <span className="mx-2 text-secondary">|</span>
        <Link to="/register">Don't have an account? Register</Link>
      </div>
    </AuthFrame>
  );
}
