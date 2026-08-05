import { NavLink, useNavigate } from 'react-router-dom';

import Icon from './Icon.jsx';
import { NAV_GROUPS } from '../../constants/navigation.js';
import { BRAND } from '../../constants/brand.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { initialsOf } from '../../utils/format.js';

export function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Revokes the refresh token server-side and clears the cookie, so the session
  // is gone rather than just hidden.
  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__head">
        <span className="sidebar__mark">
          <Icon name="shield" size={17} />
        </span>
        <span className="sidebar__brand">
          <span className="sidebar__name">{BRAND.name}</span>
          <span className="sidebar__console">{BRAND.console}</span>
        </span>

        <button
          className="sidebar__collapse"
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!collapsed}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
        </button>
      </div>

      {/* Every section, for every admin. This build only admits `admin`
          accounts (constants/auth.js PANEL_ROLE) and an admin holds the whole
          back office, so there is no lesser admin to hide a rail entry from —
          the backend still re-checks each request behind it. */}
      <nav className="sidebar__nav" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div className="sidebar__group" key={group.id}>
            {/* Hidden when collapsed — a heading over icon-only rows reads as
                clutter, and the group is still conveyed by the spacing. */}
            {group.title && <p className="sidebar__group-title">{group.title}</p>}

            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title={item.label}
              >
                <Icon name={item.icon} size={17} />
                {/* Kept in the DOM when collapsed so the rail still reads as a
                    labelled list to a screen reader. */}
                <span className="sidebar__label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar__foot">
        <span className="sidebar__avatar" aria-hidden="true">
          {initialsOf(user?.fullName)}
        </span>
        <span className="sidebar__identity">
          <span className="sidebar__user">{user?.fullName ?? 'Administrator'}</span>
          {/* Admin is the top role — there is no tier above it to distinguish
              here, so the line carries the designation instead. */}
          <span className="sidebar__role">{user?.designation || 'Admin'}</span>
        </span>
        <button
          className="sidebar__logout"
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          <Icon name="logout" size={16} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
