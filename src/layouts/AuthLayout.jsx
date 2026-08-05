import BrandPanel from '../components/BrandPanel.jsx';
import '../styles/auth.css';

/** Split card shared by every auth screen: brand panel left, form pane right. */
export function AuthLayout({ children }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <BrandPanel />
        {children}
      </div>
    </main>
  );
}

export default AuthLayout;
