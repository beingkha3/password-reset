const resetSteps = ['Request link', 'Verify token', 'Update password'];

export default function AuthFrame({ badge, title, subtitle, activeStep, children }) {
  return (
    <div className="main-content">
      <div className="auth-container">
        <div className="auth-card">
          <aside className="auth-context" aria-label="Workflow progress">
            <div>
              <span className="eyebrow">{badge}</span>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>

            {activeStep != null && (
              <ol className="workflow-steps">
                {resetSteps.map((step, index) => {
                  const stepNumber = index + 1;
                  return (
                    <li
                      key={step}
                      className={stepNumber === activeStep ? 'active' : stepNumber < activeStep ? 'complete' : ''}
                    >
                      <span>{stepNumber < activeStep ? <i className="bi bi-check-lg" /> : stepNumber}</span>
                      {step}
                    </li>
                  );
                })}
              </ol>
            )}
          </aside>

          <div className="auth-form-section">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
