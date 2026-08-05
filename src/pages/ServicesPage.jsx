import { useMemo, useState } from 'react';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import ListToolbar from '../components/dashboard/ListToolbar.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import { StatusPill } from '../components/dashboard/StatusPill.jsx';
import { DEPARTMENTS, SERVICES } from '../constants/records.js';
import { catalogStatus } from '../constants/statusTone.js';
import { rupees } from '../utils/format.js';

/* Services — what a citizen can apply for.

   Fee is the total the citizen is billed; the schema splits it into a statutory
   fee, a service charge and GST (backend/src/models/service.js) and keeps every
   part in paise. SLA is the internal turnaround target, and a breach is what
   feeds agent performance — which is why it sits next to the price rather than
   buried in a detail screen. */

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'archived', label: 'Archived' },
];

const departmentName = (id) => DEPARTMENTS.find((item) => item.id === id)?.name ?? '—';

const sla = (hours) => (hours < 48 ? `${hours} hrs` : `${Math.round(hours / 24)} days`);

export function ServicesPage() {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();

    return SERVICES.filter((service) => {
      if (department !== 'all' && service.department !== department) return false;
      if (status !== 'all' && service.status !== status) return false;
      if (!term) return true;

      return [service.name, service.code, departmentName(service.department)].some((field) =>
        field.toLowerCase().includes(term)
      );
    });
  }, [query, department, status]);

  const countFor = (key) =>
    key === 'all' ? SERVICES.length : SERVICES.filter((service) => service.status === key).length;

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
            <button className="btn btn--primary" type="button">
              <Icon name="plus" size={14} />
              Add Service
            </button>
          </div>
        </div>

        <ListToolbar value={query} onChange={setQuery} placeholder="Search by service name or code…">
          <select
            className="toolbar__select"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            aria-label="Filter by department"
          >
            <option value="all">All departments</option>
            {DEPARTMENTS.map((item) => (
              <option value={item.id} key={item.id}>
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
                onClick={() => setStatus(filter.key)}
              >
                {filter.label}
                <span className="segmented__count">{countFor(filter.key)}</span>
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

              {rows.map((service) => {
                const tone = catalogStatus(service.status);

                return (
                  <div className="table__row" role="row" key={service.id}>
                    <div className="table__cell" role="cell">
                      <span className="person__body">
                        <span className="person__name">{service.name}</span>
                        <span className="person__meta">{service.code}</span>
                      </span>
                    </div>

                    <div className="table__cell table__muted table__truncate" role="cell">
                      {departmentName(service.department)}
                    </div>

                    {/* Free is a decision, not a missing value — it reads as such. */}
                    <div className="table__cell table__amount" role="cell">
                      {service.fee === 0 ? 'Free' : rupees(service.fee)}
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
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          className="icon-button icon-button--danger"
                          type="button"
                          aria-label={`Archive ${service.name}`}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </span>
                    </div>
                  </div>
                );
              })}

              {rows.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="services" size={20} />
                  </span>
                  <p className="empty__title">No service matches those filters</p>
                  <p className="empty__text">
                    Clear the search or pick a different department to see the whole catalogue.
                  </p>
                </div>
              )}
            </div>
          </div>

          <TableFooter shown={rows.length} total={SERVICES.length} noun="services" />
        </section>
      </main>
    </DashboardLayout>
  );
}

export default ServicesPage;
