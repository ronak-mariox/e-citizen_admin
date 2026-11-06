import { useEffect, useState } from 'react';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import ListToolbar from '../components/dashboard/ListToolbar.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import { StatusPill } from '../components/dashboard/StatusPill.jsx';
import * as citizensApi from '../api/citizens.js';
import { getErrorMessage } from '../api/client.js';
import { userStatus } from '../constants/statusTone.js';
import { count, initialsOf } from '../utils/format.js';

/* Everyone who has signed up, and how much of themselves they have filled in.

   Reads from the API. Search is debounced — each keystroke would otherwise be a
   round trip, and the answer to "raj" is thrown away the moment "rajesh" is
   typed.

   No actions column, and no Add button: a citizen account comes into being when
   somebody signs in with a mobile number, and their details are theirs to
   enter. There is nothing here for an admin to create. */

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

const DATE = { day: '2-digit', month: 'short', year: 'numeric' };

const shortDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', DATE);
};

export function CitizensPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const [citizens, setCitizens] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

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

    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setLoading(true);
    setLoadError(null);

    citizensApi
      .listCitizens({ page, limit: PAGE_SIZE, search: debouncedQuery, status })
      .then((data) => {
        if (cancelled) return;

        setCitizens(data.citizens);
        setStatusCounts(data.statusCounts ?? {});
        setPagination(data.pagination);
      })
      .catch((error) => {
        if (cancelled) return;

        setLoadError(getErrorMessage(error));
        setCitizens([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery, status, reloadToken]);

  const total = pagination?.total ?? citizens.length;
  const filtered = Boolean(debouncedQuery) || status !== 'all';

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Citizens</h1>
            <p className="page__subtitle">
              Everyone who has signed up, and how far they have got with their profile
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
          onChange={changeQuery}
          placeholder="Search by name or mobile number…"
        >
          <span className="toolbar__spacer" />

          <div className="segmented" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((filter) => (
              <button
                className={
                  status === filter.key
                    ? 'segmented__button segmented__button--active'
                    : 'segmented__button'
                }
                type="button"
                key={filter.key}
                aria-pressed={status === filter.key}
                onClick={() => changeStatus(filter.key)}
              >
                {filter.label}
                <span className="segmented__count">{statusCounts[filter.key] ?? 0}</span>
              </button>
            ))}
          </div>
        </ListToolbar>

        <section className="table-shell" aria-label="Citizens">
          <div className="table__overflow">
            <div className="table table--citizens" role="table">
              <div className="table__head" role="row">
                <div role="columnheader">Citizen</div>
                <div role="columnheader">Mobile</div>
                <div role="columnheader">District</div>
                <div role="columnheader">Applications</div>
                <div role="columnheader">Status</div>
                <div role="columnheader" className="table__cell--end">
                  Joined
                </div>
              </div>

              {citizens.map((citizen) => {
                const tone = userStatus(citizen.status);

                return (
                  <div className="table__row" role="row" key={citizen.id}>
                    <div className="table__cell" role="cell">
                      <span className="person">
                        <span className="person__avatar" aria-hidden="true">
                          {initialsOf(citizen.fullName, '—')}
                        </span>
                        <span className="person__body">
                          {/* A citizen signs in with a mobile and fills in their
                              name afterwards, so a fresh account genuinely has
                              none — the number is who they are until then, and
                              a blank cell would read as missing data. */}
                          <span className="person__name">
                            {citizen.fullName ?? citizen.mobile}
                          </span>
                          <span className="person__meta">
                            {citizen.hasProfile
                              ? citizen.aadhaarLast4
                                ? `Aadhaar ••••${citizen.aadhaarLast4}`
                                : 'Profile started'
                              : 'No profile yet'}
                          </span>
                        </span>
                      </span>
                    </div>

                    <div className="table__cell" role="cell">
                      <span className="person__body">
                        <span className="person__name">{citizen.mobile}</span>
                        {/* Every citizen signs in by OTP, so an unverified
                            number means an account that has never completed
                            one — worth seeing rather than assuming. */}
                        <span className="person__meta">
                          {citizen.isMobileVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </span>
                    </div>

                    <div className="table__cell table__muted table__truncate" role="cell">
                      {citizen.district ?? '—'}
                    </div>

                    <div className="table__cell table__muted" role="cell">
                      {count(citizen.applications)}
                    </div>

                    <div className="table__cell" role="cell">
                      <StatusPill label={tone.label} tone={tone.tone} />
                    </div>

                    <div className="table__cell table__muted table__cell--end" role="cell">
                      {shortDate(citizen.createdAt)}
                    </div>
                  </div>
                );
              })}

              {/* Three different empty tables — still loading, the request
                  failed, and genuinely nothing to show — say three different
                  things, because the fix for each is different. */}
              {loading && citizens.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="refresh" size={20} />
                  </span>
                  <p className="empty__title">Loading citizens…</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="alert" size={20} />
                  </span>
                  <p className="empty__title">Could not load citizens</p>
                  <p className="empty__text">{loadError}</p>
                  <button className="btn btn--sm" type="button" onClick={reload}>
                    <Icon name="refresh" size={13} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && citizens.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="citizens" size={20} />
                  </span>
                  <p className="empty__title">
                    {filtered ? 'No citizen matches those filters' : 'No citizens yet'}
                  </p>
                  <p className="empty__text">
                    {filtered
                      ? 'Clear the search or pick a different status to see everyone.'
                      : 'An account appears here the first time somebody signs in to the app.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <TableFooter
            shown={citizens.length}
            total={total}
            noun="citizens"
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </section>
      </main>
    </DashboardLayout>
  );
}

export default CitizensPage;
