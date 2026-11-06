import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import * as notificationsApi from '../api/notifications.js';
import { getErrorMessage } from '../api/client.js';
import { NOTIFICATION_LABEL, NOTIFICATION_TONE, NOTIFICATION_TYPES } from '../constants/notifications.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';

/* Notifications.
 *
 * The same /notifications endpoint every role reads from — an application
 * assigned, a citizen's reply, a case's SLA slipping. Read as a table rather
 * than a feed, matching this console's own Audit Log rather than the agent
 * panels' card list: an admin question here is usually "what is still
 * unread", answered by scanning a column, not by reading prose bottom to top.
 *
 * There is no free-text search — the backend only ever filters this list by
 * type, so a search box here would be one that quietly did nothing. */

const PAGE_SIZE = 20;

/** Relative, unlike the audit trail's absolute stamp — a notification is
    read against "how long has this been waiting", not against other rows. */
const ageOf = (value) => {
  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(ms / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function NotificationsPage() {
  const navigate = useNavigate();

  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);

  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState({});
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [markingAll, setMarkingAll] = useState(false);
  const [rowBusy, setRowBusy] = useState(null);

  const reload = () => setReloadToken((token) => token + 1);

  /* Live refetches (useLiveRefresh) run quietly: the rows stay up while they
     load, and a failed one keeps them rather than swapping in an error. */
  const quietReload = useRef(false);
  useLiveRefresh(() => {
    quietReload.current = true;
    reload();
  }, ['notifications']);

  const changeType = (value) => {
    setType(value);
    setPage(1);
  };

  useEffect(() => {
    let cancelled = false;
    const quiet = quietReload.current;
    quietReload.current = false;

    if (!quiet) {
      setLoading(true);
      setLoadError(null);
    }

    notificationsApi
      .listMyNotifications({ page, limit: PAGE_SIZE, type })
      .then((data) => {
        if (cancelled) return;

        setLoadError(null);
        setNotifications(data.notifications ?? []);
        setUnread(data.unread ?? {});
        setPagination(data.pagination);
      })
      .catch((error) => {
        if (cancelled || quiet) return;

        setLoadError(getErrorMessage(error));
        setNotifications([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, type, reloadToken]);

  async function handleMarkAllRead() {
    setMarkingAll(true);

    try {
      const freshUnread = await notificationsApi.markNotificationsRead();
      setUnread(freshUnread);
      setNotifications((current) => current.map((row) => ({ ...row, unread: false })));
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOneRead(row) {
    if (!row.unread) return;

    setRowBusy(row.id);

    try {
      const freshUnread = await notificationsApi.markNotificationsRead(row.id);
      setUnread(freshUnread);
      setNotifications((current) =>
        current.map((one) => (one.id === row.id ? { ...one, unread: false } : one))
      );
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setRowBusy(null);
    }
  }

  /* The title/body opens the case the row is about; the Status column's own
     button only marks the row read — a click meant to clear a row while
     scanning the list should not also navigate away from it. */
  async function openNotification(row) {
    await markOneRead(row);
    if (row.link) navigate(row.link);
  }

  const total = pagination?.total ?? notifications.length;

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Notifications</h1>
            <p className="page__subtitle">
              {unread.total ? `${unread.total} unread` : 'You are all caught up'}
            </p>
          </div>

          <div className="page__actions">
            <button
              className="btn"
              type="button"
              disabled={!unread.total || markingAll}
              onClick={handleMarkAllRead}
            >
              <Icon name="check" size={14} />
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          </div>
        </div>

        <div className="segmented segmented--wrap" role="group" aria-label="Filter by type">
          <button
            className={type === 'all' ? 'segmented__button segmented__button--active' : 'segmented__button'}
            type="button"
            aria-pressed={type === 'all'}
            onClick={() => changeType('all')}
          >
            All
            <span className="segmented__count">{unread.total ?? 0}</span>
          </button>

          {NOTIFICATION_TYPES.map((option) => (
            <button
              className={
                type === option.id ? 'segmented__button segmented__button--active' : 'segmented__button'
              }
              type="button"
              key={option.id}
              aria-pressed={type === option.id}
              onClick={() => changeType(option.id)}
            >
              {option.label}
              <span className="segmented__count">{unread[option.id] ?? 0}</span>
            </button>
          ))}
        </div>

        <section className="table-shell" aria-label="Notifications">
          <div className="table__overflow">
            <div className="table table--notifications" role="table">
              <div className="table__head" role="row">
                <div role="columnheader">When</div>
                <div role="columnheader">Type</div>
                <div role="columnheader">Notification</div>
                <div role="columnheader">Status</div>
              </div>

              {notifications.map((row) => (
                <div className={row.unread ? 'table__row table__row--unread' : 'table__row'} role="row" key={row.id}>
                  <div className="table__cell table__muted" role="cell">
                    {ageOf(row.at)}
                  </div>

                  <div className="table__cell" role="cell">
                    <span className={`audit-action audit-action--${NOTIFICATION_TONE[row.type] ?? 'blue'}`}>
                      <span className="audit-action__dot" aria-hidden="true" />
                      {NOTIFICATION_LABEL[row.type] ?? row.type}
                    </span>
                  </div>

                  <div className="table__cell" role="cell">
                    {row.link ? (
                      <button
                        className="ntf-open"
                        type="button"
                        disabled={rowBusy === row.id}
                        onClick={() => openNotification(row)}
                      >
                        <span className="ntf-open__title">{row.title}</span>
                        {row.body && <span className="ntf-open__body">{row.body}</span>}
                      </button>
                    ) : (
                      <span className="ntf-open">
                        <span className="ntf-open__title">{row.title}</span>
                        {row.body && <span className="ntf-open__body">{row.body}</span>}
                      </span>
                    )}
                  </div>

                  <div className="table__cell" role="cell">
                    {row.unread ? (
                      <button
                        className="btn btn--sm"
                        type="button"
                        disabled={rowBusy === row.id}
                        onClick={() => markOneRead(row)}
                      >
                        {rowBusy === row.id ? 'Marking…' : 'Mark read'}
                      </button>
                    ) : (
                      <span className="table__muted">Read</span>
                    )}
                  </div>
                </div>
              ))}

              {loading && notifications.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="refresh" size={20} />
                  </span>
                  <p className="empty__title">Loading notifications…</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="alert" size={20} />
                  </span>
                  <p className="empty__title">Could not load notifications</p>
                  <p className="empty__text">{loadError}</p>
                  <button className="btn btn--sm" type="button" onClick={reload}>
                    <Icon name="refresh" size={13} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && notifications.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="bell" size={20} />
                  </span>
                  <p className="empty__title">
                    {type !== 'all' ? 'Nothing of this type yet' : 'Nothing here yet'}
                  </p>
                  <p className="empty__text">
                    {type !== 'all'
                      ? 'Clear the filter to see every notification.'
                      : 'Assignments, escalations and account activity will appear here as they happen.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <TableFooter
            shown={notifications.length}
            total={total}
            noun="notifications"
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </section>
      </main>
    </DashboardLayout>
  );
}

export default NotificationsPage;
