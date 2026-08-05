import { useEffect, useState } from 'react';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import ListToolbar from '../components/dashboard/ListToolbar.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import DepartmentForm from '../components/dashboard/DepartmentForm.jsx';
import ConfirmDialog from '../components/dashboard/ConfirmDialog.jsx';
import { StatusPill } from '../components/dashboard/StatusPill.jsx';
import * as departmentsApi from '../api/departments.js';
import { getErrorMessage } from '../api/client.js';
import { catalogStatus } from '../constants/statusTone.js';

/* Departments — the owning body behind every service.

   This screen reads from the API rather than from constants/records.js. The
   service and agent counts come down with each row, counted server-side: the
   console cannot derive them any more, because it no longer holds every service
   and agent in the browser to count.

   Search is debounced. Each keystroke would otherwise be a round trip, and the
   answer to "rev" is thrown away the moment "reve" is typed. */

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'archived', label: 'Archived' },
];

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

export function DepartmentsPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const [departments, setDepartments] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // null while browsing. `{}`-less: holds the department being edited, or the
  // string 'new'. One value, so "creating" and "editing" cannot both be true.
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(null);

  // The row awaiting a yes/no on deletion.
  const [confirming, setConfirming] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bumped to force a refetch when nothing in the query itself changed — after
  // a create, or when someone retries a failed load.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

  // A new search or status is a new result set, so both handlers reset to page
  // one — staying on page 3 of a list that now has one page shows nothing.
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
     API — which is what an effect is for. The rule below objects to the
     `setLoading(true)` running synchronously, and that is deliberate: the
     spinner has to appear when the request starts, not when it finishes.

     `cancelled` matters more than it looks. Typing quickly or paging twice
     leaves two requests in flight, and without the guard the slower one wins
     whenever it happens to land second — the table would show results for a
     search the user has already moved on from. */
  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setLoading(true);
    setLoadError(null);

    departmentsApi
      .listDepartments({ page, limit: PAGE_SIZE, search: debouncedQuery, status })
      .then((data) => {
        if (cancelled) return;

        setDepartments(data.departments);
        setStatusCounts(data.statusCounts ?? {});
        setPagination(data.pagination);
      })
      .catch((error) => {
        if (cancelled) return;

        setLoadError(getErrorMessage(error));
        setDepartments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery, status, reloadToken]);

  const isNew = editing === 'new';

  const closeForm = () => {
    setEditing(null);
    setSaveError(null);
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    setSaveError(null);

    try {
      const department = isNew
        ? await departmentsApi.createDepartment(payload)
        : await departmentsApi.updateDepartment(editing._id, payload);

      setSaved(`${department.name} was ${isNew ? 'created' : 'updated'}.`);
      setEditing(null);

      if (isNew) {
        // Back to the top of an unfiltered list, so the new row is on screen
        // rather than behind whatever filter happened to be set. An edit keeps
        // the filters — you were looking at that list for a reason.
        setQuery('');
        setStatus('all');
        setPage(1);
      }

      // Covers the case where the resets above changed nothing for the effect
      // to notice, and every edit, which never changes them.
      reload();
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await departmentsApi.deleteDepartment(confirming._id);

      setSaved(`${confirming.name} was deleted.`);
      setConfirming(null);
      reload();
    } catch (error) {
      // The API refuses while services or agents still point at it, and says
      // how many. That belongs on the page, not inside a dialog that is about
      // to close — it is a reason to go and do something else first.
      setSaveError(getErrorMessage(error));
      setConfirming(null);
    } finally {
      setDeleting(false);
    }
  };

  /* The form takes over the page rather than opening a dialog — the same shape
     the agent create flow uses, so the two feel like one console. A dialog tall
     enough for three sections is a scroll trap on a laptop. */
  if (editing) {
    return (
      <DashboardLayout>
        <main className="page">
          <div className="page__head">
            <div>
              <h1 className="page__title">{isNew ? 'Add a department' : `Edit ${editing.name}`}</h1>
              <p className="page__subtitle">
                {isNew
                  ? 'Services hang off a department and agents are posted to one, so this comes first'
                  : `${editing.serviceCount} service${editing.serviceCount === 1 ? '' : 's'} and ${editing.agentCount} agent${editing.agentCount === 1 ? '' : 's'} depend on this record`}
              </p>
            </div>

            <div className="page__actions">
              <button className="btn" type="button" disabled={saving} onClick={closeForm}>
                <Icon name="chevronLeft" size={14} />
                Back to departments
              </button>
            </div>
          </div>

          {saveError && (
            <p className="notice notice--error" role="alert">
              <Icon name="alert" size={15} />
              {saveError}
            </p>
          )}

          <DepartmentForm
            department={isNew ? undefined : editing}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </main>
      </DashboardLayout>
    );
  }

  const total = pagination?.total ?? departments.length;

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Departments</h1>
            <p className="page__subtitle">
              A service cannot exist without one — it decides who an application is filed with
            </p>
          </div>

          <div className="page__actions">
            <button className="btn" type="button">
              <Icon name="download" size={14} />
              Export
            </button>
            <button className="btn btn--primary" type="button" onClick={() => setEditing('new')}>
              <Icon name="plus" size={14} />
              Add Department
            </button>
          </div>
        </div>

        {saved && (
          <p className="notice">
            <Icon name="check" size={15} />
            {saved}
          </p>
        )}

        {/* A refused delete lands here rather than in the dialog it came from —
            it is a reason to go and move some services first, not something to
            read while a modal is closing. */}
        {saveError && (
          <p className="notice notice--error" role="alert">
            <Icon name="alert" size={15} />
            {saveError}
          </p>
        )}

        <ListToolbar
          value={query}
          onChange={changeQuery}
          placeholder="Search by name, code or contact…"
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

        <section className="table-shell" aria-label="Departments">
          <div className="table__overflow">
            <div className="table table--departments" role="table">
              <div className="table__head" role="row">
                <div role="columnheader">Department</div>
                <div role="columnheader">Code</div>
                <div role="columnheader">Contact</div>
                <div role="columnheader">Services</div>
                <div role="columnheader">Agents</div>
                <div role="columnheader">Status</div>
                <div role="columnheader" className="table__cell--end">
                  Actions
                </div>
              </div>

              {departments.map((department) => {
                const tone = catalogStatus(department.status);

                return (
                  <div className="table__row" role="row" key={department._id}>
                    <div className="table__cell" role="cell">
                      <span className="person__body">
                        <span className="person__name">{department.name}</span>
                        <span className="person__meta">/{department.slug}</span>
                      </span>
                    </div>

                    <div className="table__cell" role="cell">
                      <span className="tag tag--slate">{department.code}</span>
                    </div>

                    <div className="table__cell table__muted table__truncate" role="cell">
                      {department.contactEmail || '—'}
                    </div>

                    <div className="table__cell" role="cell">
                      {department.serviceCount}
                    </div>

                    <div className="table__cell" role="cell">
                      {department.agentCount}
                    </div>

                    <div className="table__cell" role="cell">
                      <StatusPill label={tone.label} tone={tone.tone} />
                    </div>

                    <div className="table__cell table__cell--end" role="cell">
                      <span className="row-actions">
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`Edit ${department.name}`}
                          onClick={() => {
                            setSaveError(null);
                            setEditing(department);
                          }}
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          className="icon-button icon-button--danger"
                          type="button"
                          aria-label={`Delete ${department.name}`}
                          onClick={() => {
                            setSaveError(null);
                            setConfirming(department);
                          }}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Three different empty tables — still loading, the request
                  failed, and genuinely nothing to show — say three different
                  things, because the fix for each is different. */}
              {loading && departments.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="refresh" size={20} />
                  </span>
                  <p className="empty__title">Loading departments…</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="alert" size={20} />
                  </span>
                  <p className="empty__title">Could not load departments</p>
                  <p className="empty__text">{loadError}</p>
                  <button className="btn btn--sm" type="button" onClick={reload}>
                    <Icon name="refresh" size={13} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && departments.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="departments" size={20} />
                  </span>
                  <p className="empty__title">
                    {debouncedQuery || status !== 'all'
                      ? 'No department matches those filters'
                      : 'No departments yet'}
                  </p>
                  <p className="empty__text">
                    {debouncedQuery || status !== 'all'
                      ? 'Clear the search or pick a different status to see the whole catalogue.'
                      : 'Add one and services and agents can start hanging off it.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <TableFooter
            shown={departments.length}
            total={total}
            noun="departments"
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </section>

        {confirming && (
          <ConfirmDialog
            title={`Delete ${confirming.name}?`}
            body="This removes the department permanently. It cannot be undone."
            /* The counts are already on the row, so the dialog can say in
               advance that this will be refused — better than letting someone
               confirm a delete that was never going to happen. */
            note={
              confirming.serviceCount || confirming.agentCount
                ? `${confirming.name} still has ${confirming.serviceCount} service${
                    confirming.serviceCount === 1 ? '' : 's'
                  } and ${confirming.agentCount} agent${
                    confirming.agentCount === 1 ? '' : 's'
                  } attached, so this will be refused. Move them elsewhere, or set the department to Archived instead.`
                : undefined
            }
            confirmLabel="Yes, delete it"
            busy={deleting}
            onCancel={() => setConfirming(null)}
            onConfirm={handleDelete}
          />
        )}
      </main>
    </DashboardLayout>
  );
}

export default DepartmentsPage;
