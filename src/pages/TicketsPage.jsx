import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import ListToolbar from '../components/dashboard/ListToolbar.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import { PriorityTag, StatusPill } from '../components/dashboard/StatusPill.jsx';
import TicketDetail from '../components/dashboard/TicketDetail.jsx';
import * as ticketsApi from '../api/tickets.js';
import { getErrorMessage } from '../api/client.js';
import { TICKET_CATEGORY_LABEL, TICKET_STATUS_TONE, priority, ticketStatus } from '../constants/statusTone.js';
import { initialsOf } from '../utils/format.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';

/* Every support ticket a citizen has raised, for the admins who answer them.

   Same shape as Applications: a debounced search, a status select carrying its
   counts, and the ticket number opening the detail, which takes the page over.
   Sorted by last activity, so a ticket the citizen just wrote back on rises to
   the top rather than sitting where it was filed. */

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

/** Workflow order, so the select reads as the lifecycle does. */
const STATUS_ORDER = ['open', 'reopened', 'assigned', 'in_progress', 'waiting_on_citizen', 'resolved', 'closed'];

const ASSIGNEE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'me', label: 'Mine' },
  { key: 'unassigned', label: 'Unassigned' },
];

const DATE = { day: '2-digit', month: 'short', year: 'numeric' };

const shortDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', DATE);
};

/** "4m ago" for what just moved, a date once it is old news — as on Applications. */
const sinceThen = (value) => {
  if (!value) return '—';

  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return '—';

  const minutes = Math.floor((Date.now() - then.getTime()) / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes < 7 * 24 * 60) return `${Math.floor(minutes / (24 * 60))}d ago`;

  return shortDate(value);
};

export function TicketsPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [page, setPage] = useState(1);

  const [tickets, setTickets] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  /* The ticket being worked — the row itself, so the detail draws its header
     at once and only the thread waits on the fetch. */
  const [opened, setOpened] = useState(null);

  /* A notification links here with `?ticketId=`. The param is cleared once
     read, so Back does not reopen it from a stale URL. */
  useEffect(() => {
    const ticketId = params.get('ticketId');
    if (!ticketId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off, from the URL
    setOpened({ id: ticketId });
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('ticketId');
        return next;
      },
      { replace: true }
    );
  }, [params, setParams]);

  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

  /* Live refetches (useLiveRefresh) run quietly: the rows stay up while they
     load, and a failed one keeps them rather than swapping in an error. */
  const quietReload = useRef(false);
  useLiveRefresh(() => {
    quietReload.current = true;
    reload();
  }, ['tickets']);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const quiet = quietReload.current;
    quietReload.current = false;

    if (!quiet) {
      setLoading(true);
      setLoadError(null);
    }

    ticketsApi
      .listTickets({ page, limit: PAGE_SIZE, search: debouncedQuery, status, category, assignee })
      .then((data) => {
        if (cancelled) return;

        setLoadError(null);
        setTickets(data.tickets);
        setStatusCounts(data.statusCounts ?? {});
        setPagination(data.pagination);
      })
      .catch((error) => {
        if (cancelled || quiet) return;

        setLoadError(getErrorMessage(error));
        setTickets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery, status, category, assignee, reloadToken]);

  /* Only the statuses that have rows, plus whichever is selected. */
  const statusOptions = useMemo(
    () => STATUS_ORDER.filter((key) => statusCounts[key] > 0 || key === status),
    [statusCounts, status]
  );

  const total = pagination?.total ?? tickets.length;
  const filtered = Boolean(debouncedQuery) || status !== 'all' || category !== 'all' || assignee !== 'all';

  /* Back from the detail refetches the table: the admin has very likely just
     changed the status or owner of the row they opened. */
  if (opened) {
    return (
      <DashboardLayout>
        <main className="page">
          <TicketDetail
            ticket={opened}
            onBack={() => {
              setOpened(null);
              reload();
            }}
          />
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Support Tickets</h1>
            <p className="page__subtitle">
              Help requests raised by citizens from the app, and where each one has got to
            </p>
          </div>

          <div className="page__actions">
            <button className="btn" type="button" onClick={reload}>
              <Icon name="refresh" size={14} />
              Refresh
            </button>
          </div>
        </div>

        <ListToolbar
          value={query}
          onChange={changeFilter(setQuery)}
          placeholder="Search by ticket number, subject, citizen or mobile…"
        >
          <select
            className="toolbar__select"
            value={status}
            onChange={(event) => changeFilter(setStatus)(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses ({statusCounts.all ?? 0})</option>
            {statusOptions.map((key) => (
              <option value={key} key={key}>
                {TICKET_STATUS_TONE[key]?.label ?? key} ({statusCounts[key] ?? 0})
              </option>
            ))}
          </select>

          <select
            className="toolbar__select"
            value={category}
            onChange={(event) => changeFilter(setCategory)(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {Object.entries(TICKET_CATEGORY_LABEL).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>

          <span className="toolbar__spacer" />

          <div className="segmented" role="group" aria-label="Filter by owner">
            {ASSIGNEE_FILTERS.map((filter) => (
              <button
                className={
                  assignee === filter.key ? 'segmented__button segmented__button--active' : 'segmented__button'
                }
                type="button"
                key={filter.key}
                aria-pressed={assignee === filter.key}
                onClick={() => changeFilter(setAssignee)(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </ListToolbar>

        <section className="table-shell" aria-label="Support tickets">
          <div className="table__overflow">
            <div className="table table--tickets" role="table">
              <div className="table__head" role="row">
                <div role="columnheader">Ticket</div>
                <div role="columnheader">Citizen</div>
                <div role="columnheader">Subject</div>
                <div role="columnheader">Category</div>
                <div role="columnheader">Assigned To</div>
                <div role="columnheader">Priority</div>
                <div role="columnheader">Status</div>
                <div role="columnheader" className="table__cell--end">
                  Last Activity
                </div>
              </div>

              {tickets.map((ticket) => {
                const tone = ticketStatus(ticket.status);
                const urgency = priority(ticket.priority);

                return (
                  <div className="table__row" role="row" key={ticket.id}>
                    <div className="table__cell" role="cell">
                      <span className="person__body">
                        <button className="card__link" type="button" onClick={() => setOpened(ticket)}>
                          {ticket.ticketNumber}
                        </button>
                        <span className="person__meta">{shortDate(ticket.createdAt)}</span>
                      </span>
                    </div>

                    <div className="table__cell" role="cell">
                      <span className="person">
                        <span className="person__avatar" aria-hidden="true">
                          {initialsOf(ticket.citizen?.fullName, '—')}
                        </span>
                        <span className="person__body">
                          <span className="person__name">
                            {ticket.citizen?.fullName ?? ticket.citizen?.mobile ?? '—'}
                          </span>
                          <span className="person__meta">{ticket.citizen?.mobile ?? '—'}</span>
                        </span>
                      </span>
                    </div>

                    <div className="table__cell" role="cell">
                      <span className="person__body">
                        <span className="person__name table__truncate">{ticket.subject}</span>
                        {/* The last word was the citizen's — the one thing an
                            admin scanning this list is looking for. */}
                        {ticket.awaitingReply && (
                          <span className="person__meta ticket__flag">Citizen replied — awaiting response</span>
                        )}
                      </span>
                    </div>

                    <div className="table__cell table__muted" role="cell">
                      {TICKET_CATEGORY_LABEL[ticket.category] ?? ticket.category}
                    </div>

                    <div className="table__cell table__truncate" role="cell">
                      {ticket.assignedTo?.name ?? <span className="table__muted">Unassigned</span>}
                    </div>

                    <div className="table__cell" role="cell">
                      <PriorityTag label={urgency.label} tone={urgency.tone} />
                    </div>

                    <div className="table__cell" role="cell">
                      <StatusPill label={tone.label} tone={tone.tone} />
                    </div>

                    <div className="table__cell table__muted table__cell--end" role="cell">
                      {sinceThen(ticket.lastActivityAt)}
                    </div>
                  </div>
                );
              })}

              {loading && tickets.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="refresh" size={20} />
                  </span>
                  <p className="empty__title">Loading tickets…</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="alert" size={20} />
                  </span>
                  <p className="empty__title">Could not load tickets</p>
                  <p className="empty__text">{loadError}</p>
                  <button className="btn btn--sm" type="button" onClick={reload}>
                    <Icon name="refresh" size={13} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && tickets.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="tickets" size={20} />
                  </span>
                  <p className="empty__title">
                    {filtered ? 'No ticket matches those filters' : 'No support tickets yet'}
                  </p>
                  <p className="empty__text">
                    {filtered
                      ? 'Clear the search or pick a different filter to see every ticket.'
                      : 'Tickets appear here the moment a citizen raises one from the app.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <TableFooter
            shown={tickets.length}
            total={total}
            noun="tickets"
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </section>
      </main>
    </DashboardLayout>
  );
}

export default TicketsPage;
