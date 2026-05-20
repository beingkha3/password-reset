import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { requestPasswordReset, verifyResetToken } from '../api/passwordResetApi';
import AuthFrame from '../components/AuthFrame';
import StatusAlert from '../components/StatusAlert';

const getPasswordChecks = (password) => [
  { label: 'At least 8 characters', passed: password.length >= 8 },
  { label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
  { label: 'One lowercase letter', passed: /[a-z]/.test(password) },
  { label: 'One number', passed: /\d/.test(password) },
  { label: 'One special character', passed: /[^A-Za-z\d]/.test(password) },
];

const isStrongPassword = (password) => getPasswordChecks(password).every((check) => check.passed);

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [tokenState, setTokenState] = useState('loading');
  const [tokenMessage, setTokenMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const verifyToken = async () => {
      if (!token) {
        setTokenState('invalid');
        setTokenMessage('This reset link is invalid. Please request a new password reset link.');
        return;
      }

      try {
        await verifyResetToken(token);
        if (mounted) {
          setTokenState('valid');
        }
      } catch (err) {
        if (!mounted) return;
        const message = err.message || 'This reset link is invalid. Please request a new password reset link.';
        setTokenMessage(message);
        setTokenState(message.toLowerCase().includes('expired') ? 'expired' : 'invalid');
      }
    };

    verifyToken();

    return () => {
      mounted = false;
    };
  }, [token]);

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordIsStrong = isStrongPassword(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = passwordIsStrong && passwordsMatch && !loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!passwordIsStrong) {
      setFormError('Please choose a stronger password that meets every requirement.');
      return;
    }

    if (!passwordsMatch) {
      setFormError('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(token, { password, confirmPassword });
      setPassword('');
      setConfirmPassword('');
      setTokenState('success');
    } catch (err) {
      setFormError(err.message || 'Unable to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenState === 'loading') {
    return (
      <AuthFrame
        badge="Link verification"
        title="Checking your reset link"
        subtitle="This usually takes a moment. We are verifying that your link is valid and not expired."
        activeStep={2}
      >
        <section className="state-panel text-center" aria-live="polite">
          <div className="spinner-border text-secondary mb-3" role="status" aria-hidden="true" />
          <h2>Verifying reset link...</h2>
          <p>Please keep this window open while we validate your request.</p>
        </section>
      </AuthFrame>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <AuthFrame
        badge="Invalid link"
        title="Reset link rejected"
        subtitle="The token in this URL does not match an active reset request."
        activeStep={2}
      >
        <section className="state-panel text-center">
          <div className="state-icon danger">
            <i className="bi bi-x-lg" />
          </div>
          <h2>Invalid reset link</h2>
          <p>{tokenMessage || 'This reset link is invalid. Please request a new password reset link.'}</p>
          <Link to="/forgot-password" className="btn btn-dark w-100">
            Request new reset link
          </Link>
        </section>
      </AuthFrame>
    );
  }

  if (tokenState === 'expired') {
    return (
      <AuthFrame
        badge="Expired link"
        title="Reset link expired"
        subtitle="For your security, password reset links are only valid for 15 minutes."
        activeStep={2}
      >
        <section className="state-panel text-center">
          <div className="state-icon warning">
            <i className="bi bi-clock-history" />
          </div>
          <h2>This reset link has expired</h2>
          <p>For your security, reset links are only valid for 15 minutes.</p>
          <Link to="/forgot-password" className="btn btn-dark w-100">
            Send new reset link
          </Link>
        </section>
      </AuthFrame>
    );
  }

  if (tokenState === 'success') {
    return (
      <AuthFrame
        badge="Password updated"
        title="Your account is secure"
        subtitle="Your password was updated and the reset token can no longer be used."
        activeStep={3}
      >
        <section className="state-panel text-center">
          <div className="state-icon success">
            <i className="bi bi-check-lg" />
          </div>
          <h2>Password updated successfully</h2>
          <p>You can now sign in with your new password.</p>
          <div className="action-stack">
            <Link to="/login" className="btn btn-dark w-100">
              Go to Sign In
            </Link>
          </div>
        </section>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      badge="Create password"
      title="Set a new password"
      subtitle="Choose a strong password. The reset token will be cleared after this update."
      activeStep={3}
    >
      <div className="form-header">
        <h2>Reset password</h2>
        <p>Enter and confirm your new password to complete account recovery.</p>
      </div>

      <StatusAlert variant="danger" message={formError} />

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            New password
          </label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="Enter new password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFormError('');
              }}
              autoComplete="new-password"
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

        <div className="password-meter" aria-label="Password strength">
          <div className="meter-track">
            <span className={`meter-segment ${passwordChecks[0].passed ? 'active' : ''}`} />
            <span className={`meter-segment ${passwordChecks[1].passed && passwordChecks[2].passed ? 'active' : ''}`} />
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
          <label htmlFor="confirmPassword" className="form-label">
            Confirm password
          </label>
          <div className="password-field">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className={`form-control ${confirmPassword && !passwordsMatch ? 'is-invalid' : ''}`}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setFormError('');
              }}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
            </button>
            {confirmPassword && !passwordsMatch && <div className="invalid-feedback">Passwords do not match.</div>}
          </div>
        </div>

        <button type="submit" className="btn btn-dark w-100" disabled={!canSubmit}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Updating password...
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </AuthFrame>
  );
}
