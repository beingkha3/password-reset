const iconByVariant = {
  success: 'bi-check-circle-fill',
  danger: 'bi-exclamation-triangle-fill',
  warning: 'bi-exclamation-circle-fill',
  info: 'bi-info-circle-fill',
};

export default function StatusAlert({ variant = 'info', message }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`alert-custom alert-${variant}`}>
      <i className={`bi ${iconByVariant[variant] || iconByVariant.info} alert-icon`}></i>
      <div>{message}</div>
    </div>
  );
}