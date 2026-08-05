import { useMemo, useState } from 'react';

import Icon from '../dashboard/Icon.jsx';
import { StatusPill } from '../dashboard/StatusPill.jsx';
import PanelCard from './PanelCard.jsx';
import PanelSearch from './PanelSearch.jsx';
import { ADMINS, DEPARTMENTS } from '../../constants/records.js';
import {
  ACCOUNT_STATUS_FILTERS,
  STAFF_ROLE_LABEL,
  STAFF_ROLE_TONE,
} from '../../constants/settings.js';
import { userStatus } from '../../constants/statusTone.js';
import { initialsOf } from '../../utils/format.js';

/* The back office — administrator accounts.

   Every row is the same role, because there is only one: an admin holds the
   whole console and nothing sits above them. What differs between two of them
   is the designation they carry and the departments they cover, which is why
   those are the columns rather than a permission summary that would read the
   same on all four rows.

   Agents are a separate collection and a separate tab: they work applications,
   these accounts configure the platform the applications run on. */

const departmentName = (id) => DEPARTMENTS.find((item) => item.id === id)?.name ?? id;

const scopeOf = (admin) =>
  admin.departments.length === 0 ? 'All departments' : admin.departments.map(departmentName).join(', ');

export function TeamMembersPanel({ user }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();

    return ADMINS.filter((admin) => {
      if (status !== 'all' && admin.status !== status) return false;
      if (!term) return true;

      return [admin.fullName, admin.email, admin.designation, admin.mobile].some((field) =>
        field.toLowerCase().includes(term)
      );
    });
  }, [query, status]);

  return (
    <PanelCard
      title="Team Members"
      count={ADMINS.length}
      subtitle="Administrator accounts — every one of them holds the full back office"
      flush
      action={
        <button className="btn btn--primary" type="button">
          <Icon name="plus" size={14} />
          Add User
        </button>
      }
    >
      <PanelSearch
        value={query}
        onChange={setQuery}
        placeholder="Search users by name, email or designation…"
      >
        <select
          className="toolbar__select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
        >
          {ACCOUNT_STATUS_FILTERS.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </PanelSearch>

      <div className="card__bleed">
        <div className="table__overflow">
          <div className="table table--team" role="table">
            <div className="table__head" role="row">
              <div role="columnheader">Name</div>
              <div role="columnheader">Email</div>
              <div role="columnheader">Role</div>
              <div role="columnheader">Departments</div>
              <div role="columnheader">Status</div>
              <div role="columnheader">Last Active</div>
              <div role="columnheader" className="table__cell--end">
                Actions
              </div>
            </div>

            {rows.map((admin) => {
              const tone = userStatus(admin.status);
              // Marked rather than hidden — an admin should see their own row,
              // just not mistake it for someone else's before suspending it.
              const isSelf = user?.email === admin.email;

              return (
                <div className="table__row" role="row" key={admin.id}>
                  <div className="table__cell" role="cell">
                    <span className="person">
                      <span className="person__avatar" aria-hidden="true">
                        {initialsOf(admin.fullName)}
                      </span>
                      <span className="person__body">
                        <span className="person__name">
                          {admin.fullName}
                          {isSelf && <span className="person__self">You</span>}
                        </span>
                        <span className="person__meta">{admin.designation}</span>
                      </span>
                    </span>
                  </div>

                  <div className="table__cell table__muted table__truncate" role="cell">
                    {admin.email}
                  </div>

                  <div className="table__cell" role="cell">
                    <span className={`tag tag--${STAFF_ROLE_TONE.admin}`}>
                      {STAFF_ROLE_LABEL.admin}
                    </span>
                  </div>

                  <div className="table__cell table__muted table__truncate" role="cell">
                    {scopeOf(admin)}
                  </div>

                  <div className="table__cell" role="cell">
                    <StatusPill label={tone.label} tone={tone.tone} />
                  </div>

                  <div className="table__cell table__muted" role="cell">
                    {admin.lastActive}
                  </div>

                  <div className="table__cell table__cell--end" role="cell">
                    <span className="row-actions">
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Edit ${admin.fullName}`}
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      {/* Suspend, not delete — the account model has a status
                          lifecycle and no removal path, because everything an
                          admin changed has to stay attributable. */}
                      <button
                        className="icon-button icon-button--danger"
                        type="button"
                        disabled={isSelf}
                        aria-label={`Suspend ${admin.fullName}`}
                      >
                        <Icon name="ban" size={15} />
                      </button>
                    </span>
                  </div>
                </div>
              );
            })}

            {rows.length === 0 && (
              <div className="empty">
                <span className="empty__icon">
                  <Icon name="admins" size={20} />
                </span>
                <p className="empty__title">No administrator matches that search</p>
                <p className="empty__text">
                  Clear the search or pick a different status to see the whole back office.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}

export default TeamMembersPanel;
