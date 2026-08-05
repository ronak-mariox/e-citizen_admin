import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '../pages/LoginPage.jsx';
import ForgotPasswordPage from '../pages/ForgotPasswordPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import AgentsPage from '../pages/AgentsPage.jsx';
import DepartmentsPage from '../pages/DepartmentsPage.jsx';
import ServicesPage from '../pages/ServicesPage.jsx';
import AuditLogPage from '../pages/AuditLogPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import SectionPlaceholderPage from '../pages/SectionPlaceholderPage.jsx';
import { NAV_ITEMS } from '../constants/navigation.js';

const BUILT_SECTIONS = [
  '/dashboard',
  '/agents',
  '/departments',
  '/services',
  '/audit-log',
  '/settings',
];
const PENDING_SECTIONS = NAV_ITEMS.filter((item) => !BUILT_SECTIONS.includes(item.to));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/agents" element={<AgentsPage />} />
      <Route path="/departments" element={<DepartmentsPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/audit-log" element={<AuditLogPage />} />
      <Route path="/settings" element={<SettingsPage />} />

      {/* Every other sidebar entry resolves to a placeholder, so the nav can be
          clicked through without dead links. */}
      {PENDING_SECTIONS.map((item) => (
        <Route key={item.to} path={item.to} element={<SectionPlaceholderPage />} />
      ))}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
