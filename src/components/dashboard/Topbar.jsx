import Icon from './Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { initialsOf } from '../../utils/format.js';

/** Long-form date, matching the chip the agent panels carry. */
function today() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function Topbar({ onOpenNav, unread = true }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <button
        className="topbar__menu"
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
      >
        <Icon name="menu" size={20} />
      </button>

      {/* One search box across every record type the console owns — an admin
          arrives knowing an application ID or a citizen's mobile, not which
          section it lives under. */}
      <div className="topbar__search">
        <Icon name="search" size={16} />
        <input
          type="search"
          placeholder="Search applications, citizens, agents…"
          aria-label="Search"
        />
      </div>

      <div className="topbar__right">
        <span className="topbar__date">
          <Icon name="calendar" size={14} />
          {today()}
        </span>

        <button className="topbar__bell" type="button" aria-label="Notifications">
          <Icon name="bell" size={19} />
          {unread && <span className="topbar__dot" aria-hidden="true" />}
        </button>

        <button className="topbar__user" type="button">
          <span className="avatar" aria-hidden="true">
            {initialsOf(user?.fullName)}
          </span>
          <span className="topbar__identity">
            <span className="topbar__username">{user?.fullName ?? 'Administrator'}</span>
            {/* Admin is the top role — there is no tier above it to distinguish
                here, so the line carries the designation instead. */}
            <span className="topbar__role">{user?.designation || 'Admin'}</span>
          </span>
          <Icon name="chevronDown" size={15} />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
