import { Link } from 'react-router-dom';
import AuthFrame from '../components/AuthFrame';

export default function LoginPage() {
  return (
    <AuthFrame
      badge="Sign in"
      title="Return to your account"
      subtitle="Use your updated password on the application sign-in screen."
      activeStep={3}
    >
      <section className="state-panel text-center">
        <div className="state-icon neutral">
          <i className="bi bi-box-arrow-in-right" />
        </div>
        <h2>Ready to sign in</h2>
        <p>Your password reset is complete. Continue with the main application sign-in screen.</p>
        <div className="action-stack">
          <Link to="/forgot-password" className="btn btn-outline-secondary w-100">
            Forgot password
          </Link>
        </div>
      </section>
      <div className="form-footer">
        <Link to="/register">Don't have an account? Register</Link>
      </div>
    </AuthFrame>
  );
}
