import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Icon from './Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import * as notificationsApi from '../../api/notifications.js';
import { useLiveRefresh } from '../../hooks/useLiveRefresh.js';
import { displayName, initialsOf } from '../../utils/format.js';

/* How often the bell checks for something new. A poll rather than a socket —
   this console has no live channel yet — cheap enough at this interval that
   opening ten tabs would not be a problem, frequent enough that "unread"
   does not sit stale for an admin's whole session. */
const UNREAD_POLL_MS = 60000;

/** Long-form date, matching the chip the agent panels carry. */
function today() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function Topbar({ onOpenNav }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const [unread, setUnread] = useState(0);
  // A new notification moves the dot at once rather than at the next minute's poll.
  const [unreadTick, setUnreadTick] = useState(0);
  useLiveRefresh(() => setUnreadTick((tick) => tick + 1), ['notifications']);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      // A single row is enough — only the bundled `unread` total is read.
      notificationsApi
        .listMyNotifications({ limit: 1 })
        .then((data) => {
          if (!cancelled) setUnread(data.unread?.total ?? 0);
        })
        .catch(() => {
          // A failed poll should not put a false badge on the bell — leave
          // whatever was last known rather than guessing.
        });
    };

    poll();
    const timer = setInterval(poll, UNREAD_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [unreadTick]);

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

        <button
          className="topbar__bell"
          type="button"
          aria-label={unread > 0 ? `Notifications — ${unread} unread` : 'Notifications'}
          onClick={() => navigate('/notifications')}
        >
          <Icon name="bell" size={19} />
          {unread > 0 && <span className="topbar__dot" aria-hidden="true" />}
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
