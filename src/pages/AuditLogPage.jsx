import { useEffect, useState } from 'react';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import ListToolbar from '../components/dashboard/ListToolbar.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import * as auditApi from '../api/audit.js';
import { getErrorMessage } from '../api/client.js';
import { initialsOf } from '../utils/format.js';

/* The audit trail.

   A table rather than a feed, because this is the screen someone opens with a
   question already formed — "who suspended that agent", "when was this account
   created" — and answering it means scanning one column, not reading prose.

   Rows come from the API. Only agent operations are recorded so far; the areas
   filter is built from whatever the trail actually contains, so a section that
   starts recording later appears in it without this screen changing. */

/** `severity` is how serious the change was; the colour is this screen's choice. */
const SEVERITY_TONE = {
  success: 'green',
  info: 'blue',
  warning: 'amber',
  critical: 'red',
};

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

/** Absolute, not "3 hours ago" — a trail is read against other records. */
const stamp = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function AuditLogPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [area, setArea] = useState('all');
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((token) => token + 1);

  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
  };

  const changeArea = (value) => {
    setArea(value);
    setPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    // The spinner has to appear when the request starts, not when it finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError(null);

    auditApi
      .listAuditLogs({ page, limit: PAGE_SIZE, search: debouncedQuery, area })
      .then((data) => {
        if (cancelled) return;

        setLogs(data.logs);
        setAreas(data.areas ?? []);
        setPagination(data.pagination);
      })
      .catch((error) => {
        if (cancelled) return;

        setLoadError(getErrorMessage(error));
        setLogs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery, area, reloadToken]);

  const total = pagination?.total ?? logs.length;

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Audit Log</h1>
            <p className="page__subtitle">
              Every recorded change — who did it, to what, and when
            </p>
          </div>

          <div className="page__actions">
            <button className="btn" type="button">
              <Icon name="download" size={14} />
              Export
            </button>
          </div>
        </div>

        <ListToolbar
          value={query}
          onChange={changeQuery}
          placeholder="Search by person, action or record…"
        >
          <select
            className="toolbar__select"
            value={area}
            onChange={(event) => changeArea(event.target.value)}
            aria-label="Filter by area"
          >
            <option value="all">All areas</option>
            {areas.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </ListToolbar>

        <section className="table-shell" aria-label="Audit log">
          <div className="table__overflow">
            <div className="table table--audit" role="table">
              <div className="table__head" role="row">
                <div role="columnheader">When</div>
                <div role="columnheader">Who</div>
                <div role="columnheader">Action</div>
                <div role="columnheader">Record</div>
                <div role="columnheader">Area</div>
              </div>

              {logs.map((entry) => (
                <div className="table__row" role="row" key={entry._id}>
                  <div className="table__cell table__muted" role="cell">
                    {stamp(entry.createdAt)}
                  </div>

                  <div className="table__cell" role="cell">
                    <span className="person">
                      <span className="person__avatar" aria-hidden="true">
                        {initialsOf(entry.actorName)}
                      </span>
                      <span className="person__body">
                        <span className="person__name">{entry.actorName}</span>
                        <span className="person__meta">{entry.actorRole ?? '—'}</span>
                      </span>
                    </span>
                  </div>

                  {/* The dot carries how serious the change was, so the column
                      can be scanned by colour rather than read line by line. */}
                  <div className="table__cell" role="cell">
                    <span
                      className={`audit-action audit-action--${
                        SEVERITY_TONE[entry.severity] ?? 'blue'
                      }`}
                    >
                      <span className="audit-action__dot" aria-hidden="true" />
                      {entry.summary}
                    </span>
                  </div>

                  <div className="table__cell table__muted table__truncate" role="cell">
                    {entry.entityLabel ?? '—'}
                  </div>

                  <div className="table__cell" role="cell">
                    <span className="tag tag--slate">{entry.area}</span>
                  </div>
                </div>
              ))}

              {loading && logs.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="refresh" size={20} />
                  </span>
                  <p className="empty__title">Loading the trail…</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="alert" size={20} />
                  </span>
                  <p className="empty__title">Could not load the audit log</p>
                  <p className="empty__text">{loadError}</p>
                  <button className="btn btn--sm" type="button" onClick={reload}>
                    <Icon name="refresh" size={13} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && logs.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="audit" size={20} />
                  </span>
                  <p className="empty__title">
                    {debouncedQuery || area !== 'all'
                      ? 'No entry matches those filters'
                      : 'Nothing recorded yet'}
                  </p>
                  <p className="empty__text">
                    {debouncedQuery || area !== 'all'
                      ? 'Clear the search or pick a different area to see the whole trail.'
                      : 'Agent operations are recorded here as they happen — create or suspend an agent and it will appear.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <TableFooter
            shown={logs.length}
            total={total}
            noun="entries"
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </section>
      </main>
    </DashboardLayout>
  );
}

export default AuditLogPage;
