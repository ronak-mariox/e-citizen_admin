import { useState } from 'react';

import Sidebar from '../components/dashboard/Sidebar.jsx';
import Topbar from '../components/dashboard/Topbar.jsx';
import '../styles/dashboard.css';

export function DashboardLayout({ children }) {
  // Desktop: the rail collapses to icons. Mobile: it slides in as a drawer.
  // Two separate flags, because the same button means different things at the
  // two breakpoints and sharing one would leave the drawer stuck open.
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const classes = ['dash'];
  if (collapsed) classes.push('dash--collapsed');
  if (drawerOpen) classes.push('dash--drawer');

  return (
    <div className={classes.join(' ')}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />

      <button
        className="dash__scrim"
        type="button"
        tabIndex={drawerOpen ? 0 : -1}
        aria-label="Close navigation"
        onClick={() => setDrawerOpen(false)}
      />

      <div className="dash__main">
        <Topbar onOpenNav={() => setDrawerOpen(true)} />
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
