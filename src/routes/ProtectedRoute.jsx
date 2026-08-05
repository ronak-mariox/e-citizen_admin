import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

/**
 * Gate for the signed-in half of the app.
 *
 * While the session is still being confirmed nothing is rendered — returning
 * the login redirect during 'loading' would bounce an agent who is in fact
 * signed in, every time they refresh the page.
 *
 * The attempted path is remembered so a re-login lands where the agent meant
 * to go rather than always on the dashboard.
 */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <p className="route-loading">Checking your session…</p>;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/**
 * The mirror image, for the auth screens: an agent who already has a session
 * should not be looking at the login form.
 */
export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <p className="route-loading">Checking your session…</p>;
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
