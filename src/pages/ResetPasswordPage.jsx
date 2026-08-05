import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout.jsx';
import ResetPasswordForm from '../components/ResetPasswordForm.jsx';
import { resetPassword } from '../api/auth.js';
import { getErrorMessage } from '../api/client.js';

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetToken = location.state?.resetToken ?? '';

  // The token is single-use and only ever arrives from the OTP screen.
  if (!resetToken) {
    return <Navigate to="/forgot-password" replace />;
  }

  async function handleSubmit({ password }) {
    try {
      await resetPassword({ resetToken, newPassword: password });

      // The reset revokes every session, so the agent must sign in again.
      navigate('/login', { replace: true });
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }

  return (
    <AuthLayout>
      <ResetPasswordForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
}

export default ResetPasswordPage;
