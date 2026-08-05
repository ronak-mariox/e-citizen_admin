import { useNavigate } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout.jsx';
import ForgotPasswordForm from '../components/ForgotPasswordForm.jsx';
import { forgotPassword } from '../api/auth.js';
import { getErrorMessage } from '../api/client.js';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  async function handleSubmit({ employeeId }) {
    try {
      // The reply is deliberately the same for an unknown employee ID, so this
      // screen always moves on — it cannot be used to probe for accounts.
      // `mobile` comes back masked, and `devOtp` only outside production.
      const data = await forgotPassword({ employeeId });

      navigate('/verify-otp', {
        state: { employeeId, mobile: data.mobile, devOtp: data.devOtp },
      });
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }

  return (
    <AuthLayout>
      <ForgotPasswordForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
