import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import ListToolbar from '../components/dashboard/ListToolbar.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import { PriorityTag, StatusPill } from '../components/dashboard/StatusPill.jsx';
import ApplicationDetail from '../components/dashboard/ApplicationDetail.jsx';
import * as applicationsApi from '../api/applications.js';
import { getErrorMessage } from '../api/client.js';
import { APPLICATION_STATUS_TONE, applicationStatus, priority } from '../constants/statusTone.js';
import { initialsOf, rupees } from '../utils/format.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';

/* Every application on the platform, whoever filed it.

   Reads from the API. Search is debounced — each keystroke would otherwise be a
   round trip, and the answer to "raj" is thrown away the moment "rajesh" is
   typed.

   No actions column: the application number opens the detail, which is the one
   thing there is to do with a row, and a column of identical eye icons says
   less than a number that is visibly clickable. */

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

/**
 * The status filter, in workflow order rather than alphabetically.
 *
 * A select and not the segmented tabs the roster uses: there are fifteen
 * statuses and a strip of fifteen buttons is a wall. The counts ride in the
 * option labels instead, so picking one is still an informed choice.
 */
const STATUS_ORDER = [
  'draft',
  'submitted',
  'assigned',
  'under_verification',
  'query_raised',
  'reupload_requested',
  'verified',
  'pending_payment',
  'pending_submission',
  'submitted_to_department',
  'in_progress',
  'escalated',
  'on_hold',
  'completed',
  'rejected',
  'cancelled',
];

const PRIORITY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'high', label: 'High' },
  { key: 'normal', label: 'Normal' },
  { key: 'low', label: 'Low' },
];

const DATE = { day: '2-digit', month: 'short', year: 'numeric' };

/** "21 Aug 2026", or a dash where a draft has never been filed. */
const shortDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', DATE);
};

/**
 * "4m ago" for something that just moved, a date once it is old news.
 *
 * The Updated column is scanned for what is happening now — an admin wants to
 * see at a glance which rows moved this morning — and a column of identical
 * dates cannot show that. Past a week the relative form stops meaning anything
 * ("31d ago"), so it hands back over to the date.
 */
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

export function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [applications, setApplications] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  /* The application being read in full — the row itself rather than an id, so
     the detail can draw its header immediately and only the body waits on the
     fetch. Null while browsing the table. */
  const [opened, setOpened] = useState(null);
  const [openError, setOpenError] = useState(null);

  /* A notification (extension requested, say) links here with `?applicationId=`
     rather than knowing this page's internal state shape. One fetch resolves it
     into the same full record a row-click would eventually land on — a little
     more than a bare row needs, but simpler than teaching the table to find or
     fake one. The param is cleared once handled so Back does not reopen it from
     a stale URL, and reload does not refetch something already dealt with. */
  useEffect(() => {
    const applicationId = params.get('applicationId');
    if (!applicationId) return undefined;

    let cancelled = false;

    applicationsApi
      .getApplication(applicationId)
      .then((data) => {
        if (!cancelled) setOpened(data);
      })
      .catch((error) => {
        if (!cancelled) setOpenError(getErrorMessage(error));
      });

    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('applicationId');
        return next;
      },
      { replace: true }
    );

    return () => {
      cancelled = true;
    };
    // Only ever meant to run for the param this page was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

  /* Live refetches (useLiveRefresh) run quietly: the rows stay up while they
     load, and a failed one keeps them rather than swapping in an error. */
  const quietReload = useRef(false);
  useLiveRefresh(() => {
    quietReload.current = true;
    reload();
  }, ['applications']);

  // A new search or filter is a new result set, so back to page one — staying
  // on page 3 of a list that now has one page shows nothing.
  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
  };

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  const changePriority = (value) => {
    setPriorityFilter(value);
    setPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  /* Fetching is this screen synchronising itself with an external system — the
     API — which is what an effect is for. `cancelled` guards against a slower
     earlier request landing after a newer one and showing results for a search
     the user has already moved on from. */
  useEffect(() => {
    let cancelled = false;
    const quiet = quietReload.current;
    quietReload.current = false;

    if (!quiet) {
      setLoading(true);
      setLoadError(null);
    }

    applicationsApi
      .listApplications({
        page,
        limit: PAGE_SIZE,
        search: debouncedQuery,
        status,
        priority: priorityFilter,
      })
      .then((data) => {
        if (cancelled) return;

        setLoadError(null);
        setApplications(data.applications);
        setStatusCounts(data.statusCounts ?? {});
        setPagination(data.pagination);
      })
      .catch((error) => {
        if (cancelled || quiet) return;

        setLoadError(getErrorMessage(error));
        setApplications([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery, status, priorityFilter, reloadToken]);

  /* Only the statuses that exist. A dropdown listing all fifteen with a zero
     beside twelve of them is a dropdown nobody reads — the ones with rows are
     the ones an admin is choosing between. The selected status stays listed
     whatever its count, so the filter can always be seen and cleared. */
  const statusOptions = useMemo(
    () => STATUS_ORDER.filter((key) => statusCounts[key] > 0 || key === status),
    [statusCounts, status]
  );

  const total = pagination?.total ?? applications.length;
  const filtered = Boolean(debouncedQuery) || status !== 'all' || priorityFilter !== 'all';

  /* One screen at a time, as on Departments and Services: the detail takes the
     page over rather than opening beside the table. It is a page's worth of
     content, and the table's filters and paging are still exactly where they
     were when Back returns to them — this component never unmounts. */
  if (opened) {
    return (
      <DashboardLayout>
        <main className="page">
          <ApplicationDetail application={opened} onBack={() => setOpened(null)} />
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Applications</h1>
            <p className="page__subtitle">
              Every application filed on the platform, and where each one has got to
            </p>
          </div>

          <div className="page__actions">
            <button className="btn" type="button" onClick={reload}>
              <Icon name="refresh" size={14} />
              Refresh
            </button>
          </div>
        </div>

        {openError && (
          <p className="notice notice--error" role="alert">
            <Icon name="alert" size={15} />
            Could not open that application — {openError}
          </p>
        )}

        <ListToolbar
          value={query}
          onChange={changeQuery}
          placeholder="Search by application number, citizen, mobile or service…"
        >
          <select
            className="toolbar__select"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses ({statusCounts.all ?? 0})</option>
            {statusOptions.map((key) => (
              <option value={key} key={key}>
                {APPLICATION_STATUS_TONE[key]?.label ?? key} ({statusCounts[key] ?? 0})
              </option>
            ))}
          </select>

          <span className="toolbar__spacer" />

          <div className="segmented" role="group" aria-label="Filter by priority">
            {PRIORITY_FILTERS.map((filter) => (
              <button
                className={
                  priorityFilter === filter.key
                    ? 'segmented__button segmented__button--active'
                    : 'segmented__button'
                }
                type="button"
                key={filter.key}
                aria-pressed={priorityFilter === filter.key}
                onClick={() => changePriority(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </ListToolbar>

        <section className="table-shell" aria-label="Applications">
          <div className="table__overflow">
            <div className="table table--applications" role="table">
              <div className="table__head" role="row">
                <div role="columnheader">Application</div>
                <div role="columnheader">Citizen</div>
                <div role="columnheader">Service</div>
                <div role="columnheader">Department</div>
                <div role="columnheader">Assigned To</div>
                <div role="columnheader">Fee</div>
                <div role="columnheader">Priority</div>
                <div role="columnheader">Extension Needed</div>
                <div role="columnheader">Status</div>
                <div role="columnheader" className="table__cell--end">
                  Updated
                </div>
              </div>

              {applications.map((application) => {
                const tone = applicationStatus(application.status);
                const urgency = priority(application.priority);

                return (
                  <div className="table__row" role="row" key={application.id}>
                    <div className="table__cell" role="cell">
                      <span className="person__body">
                        <button
                          className="card__link"
                          type="button"
                          onClick={() => setOpened(application)}
                        >
                          {application.applicationNumber}
                        </button>
                        {/* The day it was filed, under the number it was filed
                            as. A draft has no filing date and says so rather
                            than borrowing the day it was last touched. */}
                        <span className="person__meta">{shortDate(application.submittedAt)}</span>
                      </span>
                    </div>

                    <div className="table__cell" role="cell">
                      <span className="person">
                        <span className="person__avatar" aria-hidden="true">
                          {initialsOf(application.citizen?.fullName, '—')}
                        </span>
                        <span className="person__body">
                          {/* A citizen who has not filled in their profile has
                              no name anywhere, and the mobile is who they are —
                              so it leads rather than showing a blank row. */}
                          <span className="person__name">
                            {application.citizen?.fullName ?? application.citizen?.mobile ?? '—'}
                          </span>
                          <span className="person__meta">{application.citizen?.mobile ?? '—'}</span>
                        </span>
                      </span>
                    </div>

                    <div className="table__cell table__truncate" role="cell">
                      {application.service?.name ?? '—'}
                    </div>

                    <div className="table__cell table__muted table__truncate" role="cell">
                      {application.department?.name ?? '—'}
                    </div>

                    {/* Nobody until the queue hands it to an officer, which is
                        the normal state of a fresh application — so this says
                        "Unassigned" rather than going blank, which would read
                        as missing data. */}
                    <div className="table__cell table__truncate" role="cell">
                      {application.assignedAgent?.name ? (
                        <span className="person__body">
                          <span className="person__name">{application.assignedAgent.name}</span>
                          {/* How they came to have it — the platform's own
                              choice, or an admin's. */}
                          <span className="person__meta">
                            {application.assignmentType === 'MANUAL'
                              ? 'Assigned manually'
                              : 'Assigned automatically'}
                          </span>
                        </span>
                      ) : (
                        <span className="table__muted">Unassigned</span>
                      )}
                    </div>

                    <div className="table__cell" role="cell">
                      <span className="person__body">
                        {/* Paise on the API, rupees here. */}
                        <span className="person__name">
                          {rupees((application.totalAmount ?? 0) / 100)}
                        </span>
                        <span className="person__meta">
                          {application.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </span>
                    </div>

                    <div className="table__cell" role="cell">
                      <PriorityTag label={urgency.label} tone={urgency.tone} />
                    </div>

                    {/* An Agent 2 extension request still waiting on an
                        admin's Approve/Reject — see ApplicationDetail.jsx.
                        Yes is a flag to act on, not just a fact, hence the
                        red rather than a neutral tone. */}
                    <div className="table__cell" role="cell">
                      <StatusPill
                        label={application.extensionNeeded ? 'Yes' : 'No'}
                        tone={application.extensionNeeded ? 'red' : 'slate'}
                      />
                    </div>

                    <div className="table__cell" role="cell">
                      <StatusPill label={tone.label} tone={tone.tone} />
                    </div>

                    <div className="table__cell table__muted table__cell--end" role="cell">
                      {sinceThen(application.updatedAt)}
                    </div>
                  </div>
                );
              })}

              {/* Three different empty tables — still loading, the request
                  failed, and genuinely nothing to show — say three different
                  things, because the fix for each is different. */}
              {loading && applications.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="refresh" size={20} />
                  </span>
                  <p className="empty__title">Loading applications…</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="alert" size={20} />
                  </span>
                  <p className="empty__title">Could not load applications</p>
                  <p className="empty__text">{loadError}</p>
                  <button className="btn btn--sm" type="button" onClick={reload}>
                    <Icon name="refresh" size={13} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && applications.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="applications" size={20} />
                  </span>
                  <p className="empty__title">
                    {filtered ? 'No application matches those filters' : 'No applications yet'}
                  </p>
                  <p className="empty__text">
                    {filtered
                      ? 'Clear the search or pick a different status to see everything filed.'
                      : 'Applications appear here the moment a citizen files one.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <TableFooter
            shown={applications.length}
            total={total}
            noun="applications"
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </section>
      </main>
    </DashboardLayout>
  );
}

export default ApplicationsPage;
