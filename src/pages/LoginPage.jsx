import { useLocation, useNavigate } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout.jsx';
import LoginForm from '../components/LoginForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  console.log('login page', signIn);

  // Set by ProtectedRoute when a guard bounced the agent here, so a re-login
  // returns them to the page they actually wanted.
  const from = location.state?.from ?? '/dashboard';

  async function handleSubmit({ email, password }) {
    // signIn stores the session and throws an Error with a readable message;
    // LoginForm catches it and shows it above the submit button.
    await signIn({ email, password });
    console.log(email, password);

    navigate(from, { replace: true });
  }

  return (
    <AuthLayout>
      <LoginForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
}

export default LoginPage;
