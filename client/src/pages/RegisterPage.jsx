import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../api/passwordResetApi';
import AuthFrame from '../components/AuthFrame';
import StatusAlert from '../components/StatusAlert';

const getPasswordChecks = (password) => [
  { label: 'At least 8 characters', passed: password.length >= 8 },
  { label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
  { label: 'One lowercase letter', passed: /[a-z]/.test(password) },
  { label: 'One number', passed: /\d/.test(password) },
  { label: 'One special character', passed: /[^A-Za-z\d]/.test(password) },
];

const isStrongPassword = (password) => getPasswordChecks(password).every((c) => c.passed);
const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value.trim());

export default function RegisterPage() {
  const [screen, setScreen] = useState('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordIsStrong = isStrongPassword(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit =
    name.trim().length > 0 &&
    isValidEmail(email) &&
    passwordIsStrong &&
    passwordsMatch &&
    !loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!passwordIsStrong) {
      setError('Please choose a stronger password that meets every requirement.');
      return;
    }
    if (!passwordsMatch) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    try {
      await registerUser(name.trim(), email.trim(), password);
      setRegisteredEmail(email.trim());
      setScreen('success');
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'success') {
    return (
      <AuthFrame
        badge="Account created"
        title="You're all set"
        subtitle="Your account is ready. Use it to test the full password reset flow."
      >
        <section className="state-panel text-center" aria-live="polite">
          <div className="state-icon success">
            <i className="bi bi-person-check" />
          </div>
          <h2>Account created</h2>
          <p>
            <strong>{registeredEmail}</strong> is now registered. You can use it to test the
            password reset flow from start to finish.
          </p>
          <div className="action-stack">
            <Link to="/forgot-password" className="btn btn-dark w-100">
              Start password reset
            </Link>
            <Link to="/login" className="btn btn-outline-secondary w-100">
              Go to sign in
            </Link>
          </div>
        </section>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      badge="New account"
      title="Create your account"
      subtitle="Register with your email and a strong password to explore the full password reset flow."
    >
      <div className="form-header">
        <h2>Register</h2>
        <p>Create an account to test the forgot password and reset password flow end to end.</p>
      </div>

      <StatusAlert variant="danger" message={error} />

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Full name
          </label>
          <input
            id="name"
            type="text"
            className="form-control"
            placeholder="Your name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            autoComplete="name"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="reg-email" className="form-label">
            Email address
          </label>
          <input
            id="reg-email"
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
          <label htmlFor="reg-password" className="form-label">
            Password
          </label>
          <div className="password-field">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="Create a strong password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
            </button>
          </div>
        </div>

        <div className="password-meter" aria-label="Password strength">
          <div className="meter-track">
            <span className={`meter-segment ${passwordChecks[0].passed ? 'active' : ''}`} />
            <span
              className={`meter-segment ${
                passwordChecks[1].passed && passwordChecks[2].passed ? 'active' : ''
              }`}
            />
            <span className={`meter-segment ${passwordChecks[3].passed ? 'active' : ''}`} />
            <span className={`meter-segment ${passwordChecks[4].passed ? 'active' : ''}`} />
          </div>
          <div className="strength-list">
            {passwordChecks.map((check) => (
              <span key={check.label} className={check.passed ? 'valid' : ''}>
                <i className={`bi ${check.passed ? 'bi-check-circle' : 'bi-circle'}`} />
                {check.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="reg-confirmPassword" className="form-label">
            Confirm password
          </label>
          <div className="password-field">
            <input
              id="reg-confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className={`form-control ${confirmPassword && !passwordsMatch ? 'is-invalid' : ''}`}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError('');
              }}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
            </button>
            {confirmPassword && !passwordsMatch && (
              <div className="invalid-feedback">Passwords do not match.</div>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-dark w-100" disabled={!canSubmit}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className="form-footer">
        <Link to="/login">Already have an account? Sign in</Link>
      </div>
    </AuthFrame>
  );
}
