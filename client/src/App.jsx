import { Navigate, Route, Routes } from 'react-router-dom';
import SiteNavbar from './components/SiteNavbar';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
  return (
    <div className="app-shell min-vh-100">
      <SiteNavbar />
      <Routes>
        <Route path="/" element={<Navigate to="/forgot-password" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/forgot-password" replace />} />
      </Routes>
    </div>
  );
}
