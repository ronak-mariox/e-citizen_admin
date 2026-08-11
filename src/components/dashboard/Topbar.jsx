import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Icon from './Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { displayName, initialsOf } from '../../utils/format.js';

/** Long-form date, matching the chip the agent panels carry. */
function today() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function Topbar({ onOpenNav, unread = true }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  /* A menu that only closed on its own trigger would sit open behind whatever
     was clicked next. Escape closes it too, because a dropdown opened by
     keyboard has to be dismissable the same way. */
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

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

        <div className="topbar__account" ref={menuRef}>
          <button
            className="topbar__user"
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            {/* Both read the same name, so the initials in the circle always
                match the words beside them. */}
            <span className="avatar" aria-hidden="true">
              {initialsOf(displayName(user))}
            </span>
            <span className="topbar__identity">
              <span className="topbar__username">{displayName(user)}</span>
              {/* Admin is the top role — there is no tier above it to
                  distinguish here, so the line carries the designation. */}
              <span className="topbar__role">{user?.designation || 'Admin'}</span>
            </span>
            <Icon name="chevronDown" size={15} />
          </button>

          {open && (
            <div className="menu" role="menu">
              {/* The email is the login identifier and the one thing the
                  profile screen cannot change, so it is stated here instead. */}
              <div className="menu__head">
                <span className="menu__name">{displayName(user)}</span>
                <span className="menu__meta">{user?.email}</span>
              </div>

              <button
                className="menu__item"
                type="button"
                role="menuitem"
                onClick={() => go('/profile')}
              >
                <Icon name="citizens" size={15} />
                Profile
              </button>

              <button
                className="menu__item"
                type="button"
                role="menuitem"
                onClick={() => go('/settings')}
              >
                <Icon name="settings" size={15} />
                Settings
              </button>

              <button
                className="menu__item menu__item--danger"
                type="button"
                role="menuitem"
                onClick={handleSignOut}
              >
                <Icon name="logout" size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
