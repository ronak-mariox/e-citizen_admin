import { useEffect, useRef, useState } from 'react';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import ListToolbar from '../components/dashboard/ListToolbar.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import PageBack from '../components/dashboard/PageBack.jsx';
import ServiceForm from '../components/service/ServiceForm.jsx';
import ConfirmDialog from '../components/dashboard/ConfirmDialog.jsx';
import { StatusPill } from '../components/dashboard/StatusPill.jsx';
import * as departmentsApi from '../api/departments.js';
import * as servicesApi from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import { catalogStatus } from '../constants/statusTone.js';
import { rupees } from '../utils/format.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';
import '../styles/service-builder.css';

/* Services — what a citizen can apply for.

   Fee is the total the citizen is billed; the schema splits it into a statutory
   fee, a service charge and GST (backend/src/models/service.js) and keeps every
   part in paise. SLA is the internal turnaround target, and a breach is what
   feeds agent performance — which is why it sits next to the price rather than
   buried in a detail screen.

   This screen reads from the API, the same shape DepartmentsPage uses: the
   search is debounced, the status counts are computed server-side across the
   whole catalogue rather than from the page in the browser, and paging is the
   API's. */

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

const sla = (hours) => (hours < 48 ? `${hours} hrs` : `${Math.round(hours / 24)} days`);

/* Every fee on the document is an integer in paise (see common_schema.js), and
   `totalFee` is the virtual that adds up the parts the citizen actually pays. */
const feeLabel = (service) => {
  const paise = service.totalFee ?? 0;

  // Free is a decision, not a missing value — it reads as such.
  return paise === 0 ? 'Free' : rupees(paise / 100);
};

/* The code is optional on the schema and nothing sets one yet, so the line
   under the name falls back to the slug — which the API always derives. The
   field count is what makes a row worth scanning on a form-builder console. */
const serviceMeta = (service) => {
  const handle = service.code || `/${service.slug}`;
  const fields = service.formFieldCount ?? 0;

  return `${handle} · ${fields} field${fields === 1 ? '' : 's'}`;
};

export function ServicesPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const [services, setServices] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // For the department filter. Its own request, because the service rows only
  // carry the departments that happen to be on this page.
  const [departments, setDepartments] = useState([]);

  // null while browsing. Holds the service being edited, or the string 'new'.
  // One value, the same as DepartmentsPage, so "creating" and "editing" cannot
  // both be true.
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(null);

  // The row whose full record is being fetched before the form can open — the
  // list rows have no `formFields` on them.
  const [opening, setOpening] = useState(null);

  // The row awaiting a yes/no on deletion.
  const [confirming, setConfirming] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bumped to force a refetch when nothing in the query itself changed — after
  // a create, or when someone retries a failed load.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

  /* Live refetches (useLiveRefresh) run quietly: the rows stay up while they
     load, and a failed one keeps them rather than swapping in an error. */
  const quietReload = useRef(false);
  useLiveRefresh(() => {
    quietReload.current = true;
    reload();
  }, ['catalog']);

  // A new search, department or status is a new result set, so all three reset
  // to page one — staying on page 3 of a list that now has one page shows
  // nothing.
  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
  };

  const changeDepartment = (value) => {
    setDepartment(value);
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

  /* `cancelled` matters more than it looks. Typing quickly or paging twice
     leaves two requests in flight, and without the guard the slower one wins
     whenever it happens to land second — the table would show results for a
     search the user has already moved on from. */
  useEffect(() => {
    let cancelled = false;
    const quiet = quietReload.current;
    quietReload.current = false;

    if (!quiet) {
      // The spinner has to appear when the request starts, not when it finishes.
      setLoading(true);
      setLoadError(null);
    }

    servicesApi
      .listServices({ page, limit: PAGE_SIZE, search: debouncedQuery, status, department })
      .then((data) => {
        if (cancelled) return;

        setLoadError(null);
        setServices(data.services);
        setStatusCounts(data.statusCounts ?? {});
        setPagination(data.pagination);
      })
      .catch((error) => {
        if (cancelled || quiet) return;

        setLoadError(getErrorMessage(error));
        setServices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery, status, department, reloadToken]);

  /* The filter list reloads with the table, so a department added elsewhere
     appears in it. A failure keeps whatever the dropdown already had, which is
     not worth a message of its own — the table below is already saying whether
     the API is reachable. */
  useEffect(() => {
    let cancelled = false;

    departmentsApi
      .listDepartments({ limit: 100 })
      .then((data) => {
        if (!cancelled) setDepartments(data.departments);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const isNew = editing === 'new';

  const closeForm = () => {
    setEditing(null);
    setSaveError(null);
  };

  /* A row carries no `formFields` — the list endpoint leaves the form out —
     so editing starts with a fetch of the whole record. Until it lands the page
     stays on the table, with the row's own button showing why. */
  const openForEdit = async (service) => {
    setOpening(service._id);
    setSaved(null);
    setSaveError(null);

    try {
      setEditing(await servicesApi.getService(service._id));
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setOpening(null);
    }
  };

  /* One request either way: `formFields` is embedded in the Service document,
     so the form the citizen fills in is saved with the service rather than
     after it. */
  const handleSubmit = async (payload) => {
    setSaving(true);
    setSaveError(null);

    try {
      const service = isNew
        ? await servicesApi.createService(payload)
        : await servicesApi.updateService(editing._id, payload);

      const fields = payload.formFields.length;
      const form = `${fields} form field${fields === 1 ? '' : 's'}`;

      // The status is read back off the saved record rather than the payload —
      // it is what the service actually is now, not what was asked for.
      const label = catalogStatus(service.status).label;

      if (isNew) {
        setSaved(
          service.status === 'active'
            ? `${service.name} is live in the catalogue with ${form}.`
            : `${service.name} was saved as a draft with ${form} — publish it when the form is ready.`
        );
      } else {
        setSaved(`${service.name} was updated — ${form} saved, now ${label}.`);
      }
      setEditing(null);

      if (isNew) {
        // Back to the top of an unfiltered list, so the new row is on screen
        // rather than behind whatever filter happened to be set. An edit keeps
        // the filters — you were looking at that list for a reason.
        setQuery('');
        setStatus('all');
        setDepartment('all');
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
      await servicesApi.deleteService(confirming._id);

      setSaved(`${confirming.name} was deleted.`);
      setConfirming(null);
      reload();
    } catch (error) {
      // The API refuses while applications point at it, and says how many. That
      // belongs on the page, not inside a dialog that is about to close — it is
      // a reason to archive instead.
      setSaveError(getErrorMessage(error));
      setConfirming(null);
    } finally {
      setDeleting(false);
    }
  };

  /* The form takes over the page rather than opening a dialog — the same shape
     the department and agent create flows use. A field builder tall enough for
     a dozen cards is not something to scroll inside a modal. */
  if (editing) {
    return (
      <DashboardLayout>
        <main className="page">
          <div className="page__head">
            <div>
              <PageBack label="Back to services" disabled={saving} onClick={closeForm} />

              <h1 className="page__title">{isNew ? 'Create service' : `Edit ${editing.name}`}</h1>
              <p className="page__subtitle">
                {isNew
                  ? 'The service, and the form a citizen fills in to apply for it — both saved as one record'
                  : 'Renaming is safe; changing a field key is not — answers already stored under the old one are orphaned'}
              </p>
            </div>
          </div>

          {saveError && (
            <p className="notice notice--error" role="alert">
              <Icon name="alert" size={15} />
              {saveError}
            </p>
          )}

          <ServiceForm
            service={isNew ? undefined : editing}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </main>
      </DashboardLayout>
    );
  }

  const total = pagination?.total ?? services.length;

  // Whether an empty table means "nothing matches" or "nothing exists yet".
  const filtered = Boolean(debouncedQuery) || status !== 'all' || department !== 'all';

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Services</h1>
            <p className="page__subtitle">
              Fees are what the citizen pays in total; SLA is the turnaround an agent is measured on
            </p>
          </div>

          <div className="page__actions">
            <button className="btn" type="button">
              <Icon name="download" size={14} />
              Export
            </button>
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => {
                setSaved(null);
                setSaveError(null);
                setEditing('new');
              }}
            >
              <Icon name="plus" size={14} />
              Add Service
            </button>
          </div>
        </div>

        {saved && (
          <p className="notice">
            <Icon name="check" size={15} />
            {saved}
          </p>
        )}

        {saveError && (
          <p className="notice notice--error" role="alert">
            <Icon name="alert" size={15} />
            {saveError}
          </p>
        )}

        <ListToolbar
          value={query}
          onChange={changeQuery}
          placeholder="Search by service name, code or description…"
        >
          <select
            className="toolbar__select"
            value={department}
            onChange={(event) => changeDepartment(event.target.value)}
            aria-label="Filter by department"
          >
            <option value="all">All departments</option>
            {departments.map((item) => (
              <option value={item._id} key={item._id}>
                {item.name}
              </option>
            ))}
          </select>

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

        <section className="table-shell" aria-label="Services">
          <div className="table__overflow">
            <div className="table table--services" role="table">
              <div className="table__head" role="row">
                <div role="columnheader">Service</div>
                <div role="columnheader">Department</div>
                <div role="columnheader">Fee</div>
                <div role="columnheader">SLA</div>
                <div role="columnheader">Status</div>
                <div role="columnheader" className="table__cell--end">
                  Actions
                </div>
              </div>

              {services.map((service) => {
                const tone = catalogStatus(service.status);

                return (
                  <div className="table__row" role="row" key={service._id}>
                    <div className="table__cell" role="cell">
                      <span className="person__body">
                        <span className="person__name">{service.name}</span>
                        <span className="person__meta">{serviceMeta(service)}</span>
                      </span>
                    </div>

                    <div className="table__cell table__muted table__truncate" role="cell">
                      {service.department?.name ?? '—'}
                    </div>

                    <div className="table__cell table__amount" role="cell">
                      {feeLabel(service)}
                    </div>

                    <div className="table__cell table__muted" role="cell">
                      {sla(service.slaHours)}
                    </div>

                    <div className="table__cell" role="cell">
                      <StatusPill label={tone.label} tone={tone.tone} />
                    </div>

                    <div className="table__cell table__cell--end" role="cell">
                      <span className="row-actions">
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`Edit ${service.name}`}
                          disabled={opening === service._id}
                          onClick={() => openForEdit(service)}
                        >
                          {/* The form cannot open until the whole record, form
                              fields included, has been fetched. */}
                          <Icon name={opening === service._id ? 'refresh' : 'edit'} size={15} />
                        </button>
                        <button
                          className="icon-button icon-button--danger"
                          type="button"
                          aria-label={`Delete ${service.name}`}
                          onClick={() => {
                            setSaved(null);
                            setSaveError(null);
                            setConfirming(service);
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
              {loading && services.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="refresh" size={20} />
                  </span>
                  <p className="empty__title">Loading services…</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="alert" size={20} />
                  </span>
                  <p className="empty__title">Could not load services</p>
                  <p className="empty__text">{loadError}</p>
                  <button className="btn btn--sm" type="button" onClick={reload}>
                    <Icon name="refresh" size={13} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && services.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="services" size={20} />
                  </span>
                  <p className="empty__title">
                    {filtered ? 'No service matches those filters' : 'No services yet'}
                  </p>
                  <p className="empty__text">
                    {filtered
                      ? 'Clear the search or pick a different department to see the whole catalogue.'
                      : 'Add one and citizens have something to apply for — the application form is built with it.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <TableFooter
            shown={services.length}
            total={total}
            noun="services"
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </section>

        {confirming && (
          <ConfirmDialog
            title={`Delete ${confirming.name}?`}
            body="This removes the service and its application form permanently. It cannot be undone."
            /* The counter is already on the row's record, so the dialog can say
               in advance that this will be refused — better than letting
               someone confirm a delete that was never going to happen. */
            note={
              confirming.stats?.totalApplications
                ? `${confirming.stats.totalApplications} application${
                    confirming.stats.totalApplications === 1 ? ' has' : 's have'
                  } been filed against it, so this will be refused. Set the service to Inactive instead — the applications need it to stay readable.`
                : 'Citizens lose sight of it immediately. Archive it instead if it may come back.'
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

export default ServicesPage;
