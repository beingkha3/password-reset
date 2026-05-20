import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestForgotPassword } from '../api/passwordResetApi';
import AuthFrame from '../components/AuthFrame';
import StatusAlert from '../components/StatusAlert';

const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value.trim());

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [screen, setScreen] = useState('form');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const trimmedEmail = email.trim();
  const emailIsValid = isValidEmail(trimmedEmail);
  const showEmailError = emailTouched && trimmedEmail && !emailIsValid;

  const sendResetLink = async (targetEmail) => {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const response = await requestForgotPassword(targetEmail.trim());
      setSubmittedEmail(targetEmail.trim());
      setPreviewUrl(response.previewUrl || '');
      setScreen('sent');
      setInfo(response.message || 'Reset link sent. Please check your email.');
    } catch (err) {
      setError(err.message || 'Unable to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setEmailTouched(true);

    if (!emailIsValid) {
      setError('Please enter a valid email address.');
      return;
    }

    sendResetLink(trimmedEmail);
  };

  const handleResend = () => {
    if (submittedEmail) {
      sendResetLink(submittedEmail);
    }
  };

  const handleChangeEmail = () => {
    setScreen('form');
    setInfo('');
    setError('');
    setEmail(submittedEmail);
  };

  return (
    <AuthFrame
      badge="Account recovery"
      title="Reset your password"
      subtitle="Use the email linked to your account. Reset links expire after 15 minutes."
      activeStep={1}
    >
      {screen === 'sent' ? (
        <section className="state-panel text-center" aria-live="polite">
          <div className="state-icon success">
            <i className="bi bi-envelope-check" />
          </div>
          <h2>Reset link sent</h2>
          <p>
            Please check <strong>{submittedEmail}</strong>. This link will expire in 15 minutes.
          </p>
          <StatusAlert variant="success" message={info} />
          <div className="action-stack">
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-dark w-100"
              >
                <i className="bi bi-box-arrow-up-right me-2" />
                Open reset link
              </a>
            )}
            <Link to="/login" className="btn btn-outline-secondary w-100">
              Back to sign in
            </Link>
            <button type="button" className="btn btn-outline-secondary w-100" onClick={handleResend} disabled={loading}>
              {loading ? 'Resending...' : 'Resend reset link'}
            </button>
            <button type="button" className="btn btn-link text-secondary" onClick={handleChangeEmail}>
              Change email address
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="form-header">
            <h2>Forgot password?</h2>
            <p>Enter your registered email and we will send a secure password reset link.</p>
          </div>

          <StatusAlert variant="danger" message={error} />

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className={`form-control ${showEmailError ? 'is-invalid' : ''}`}
                placeholder="name@example.com"
                value={email}
                onBlur={() => setEmailTouched(true)}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                autoComplete="email"
                required
              />
              {showEmailError && <div className="invalid-feedback">Enter a valid email address.</div>}
              <div className="form-text">The reset link is valid for 15 minutes only.</div>
            </div>

            <button type="submit" className="btn btn-dark w-100" disabled={!emailIsValid || loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <div className="form-footer">
            <Link to="/login">Back to sign in</Link>
          </div>
        </>
      )}
    </AuthFrame>
  );
}
