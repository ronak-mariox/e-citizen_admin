import { useEffect, useState } from 'react';

import Icon from './Icon.jsx';
import * as servicesApi from '../../api/services.js';
import { EDIT_STATUS_OPTIONS, findLevel, statusNote } from '../../constants/agentForm.js';

/* Edit an agent — what can be corrected after the account exists.

   Its own component rather than a mode on AgentForm: the two forms overlap on
   three fields and disagree about everything else. A create decides the level,
   the department and the first password, and none of those can be revisited —
   the employee ID is built from the first two and is what the agent signs in
   with, and a password is reset, not edited. What is left is the name, the two
   ways to reach them, their service scope, and the account status.

   Status is submitted separately by the page, because the API keeps it on its
   own route: changing it ends the agent's session and is recorded in the trail
   differently from a detail edit. */

export function AgentEditForm({ agent, saving = false, onSubmit, onCancel }) {
  const level = findLevel(agent.role === 'agent_2' ? 'l2' : 'l1');
  const department = agent.department ?? {};

  const [form, setForm] = useState(() => ({
    fullName: agent.fullName ?? '',
    mobile: agent.mobile ?? '',
    email: agent.email ?? '',
    services: (agent.assignedServices ?? []).map((service) => service._id ?? service),
    status: agent.status ?? 'active',
    reason: '',
  }));

  const [services, setServices] = useState([]);
  // An agent with no posting has nothing to load, so it is not "loading" —
  // seeding the flag from that keeps the effect free of a synchronous setState.
  const [loadingServices, setLoadingServices] = useState(Boolean(department._id));

  /* Only this department's services can be assigned — the API refuses the rest,
     because routing hands out applications by department and a service from
     elsewhere is work this agent could never pick up. */
  useEffect(() => {
    let cancelled = false;
    const departmentId = department._id;

    if (!departmentId) return undefined;

    servicesApi
      .listServices({ limit: 100, department: departmentId })
      .then((data) => {
        if (!cancelled) setServices(data.services);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false);
      });

    return () => {
      cancelled = true;
    };
  }, [department._id]);

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const toggleService = (id) =>
    set(
      'services',
      form.services.includes(id)
        ? form.services.filter((item) => item !== id)
        : [...form.services, id]
    );

  const statusChanged = form.status !== agent.status;

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      details: {
        fullName: form.fullName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim().toLowerCase(),
        assignedServices: form.services,
      },
      // Left undefined when it did not move, so an edit of someone's phone
      // number does not write a status row into the audit trail.
      status: statusChanged ? { status: form.status, reason: form.reason.trim() } : undefined,
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="form__lead">
        Editing <strong>{agent.employeeId}</strong>. The employee ID, the level and the posting are
        fixed — the first is built from the other two, and the agent signs in with it. An agent who
        has genuinely changed job needs a new account rather than a rewritten one.
      </p>

      {/* ---------------------------------------------------------- posting */}
      <section className="form__group">
        <h2 className="form__group-title">Posting</h2>
        <p className="form__group-hint">Set when the account was opened, and fixed since.</p>

        <div className="form__grid">
          <div className="field2">
            <span className="field2__label">Employee ID</span>
            <p className="field2__static field2__static--code">{agent.employeeId}</p>
            <span className="field2__hint">What the agent signs in with.</span>
          </div>

          <div className="field2">
            <span className="field2__label">Level</span>
            <p className="field2__static">{level.label}</p>
            <span className="field2__hint">{level.duties}</span>
          </div>

          <div className="field2">
            <span className="field2__label">Department</span>
            <p className="field2__static">
              {department.name ?? '—'}
              {department.code ? ` (${department.code})` : ''}
            </p>
            <span className="field2__hint">Its code is the middle segment of the employee ID.</span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- details */}
      <section className="form__group">
        <h2 className="form__group-title">Details</h2>
        <p className="form__group-hint">
          The name shown on every application they touch, and how the platform reaches them.
        </p>

        <div className="form__grid">
          <label className="field2">
            <span className="field2__label">Full name *</span>
            <input
              className="field2__input"
              value={form.fullName}
              maxLength={120}
              placeholder="Enter the agent's full name"
              required
              onChange={(event) => set('fullName', event.target.value)}
            />
          </label>

          <label className="field2">
            <span className="field2__label">Mobile *</span>
            <input
              className="field2__input"
              type="tel"
              value={form.mobile}
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              placeholder="Enter a 10-digit mobile number"
              required
              onChange={(event) => set('mobile', event.target.value.replace(/\D/g, ''))}
            />
            <span className="field2__hint">
              Where a password-reset code is sent. Must be unique across staff.
            </span>
          </label>

          <label className="field2">
            <span className="field2__label">Email *</span>
            <input
              className="field2__input"
              type="email"
              value={form.email}
              maxLength={120}
              placeholder="Enter the work email address"
              required
              onChange={(event) => set('email', event.target.value)}
            />
          </label>

          <div className="field2 field2--full">
            <span className="field2__label">Assigned services</span>

            {services.length > 0 ? (
              <div className="chips">
                {services.map((service) => (
                  <button
                    className={form.services.includes(service._id) ? 'chip chip--on' : 'chip'}
                    type="button"
                    key={service._id}
                    aria-pressed={form.services.includes(service._id)}
                    onClick={() => toggleService(service._id)}
                  >
                    {form.services.includes(service._id) && <Icon name="check" size={12} />}
                    {service.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="field2__hint">
                {loadingServices
                  ? 'Loading services…'
                  : `No services are set up for ${department.name ?? 'this department'} yet, so this agent can be assigned any of them once there are.`}
              </p>
            )}

            <span className="field2__hint">
              Leave empty to allow every service in the department.
            </span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- status */}
      <section className="form__group">
        <h2 className="form__group-title">Account status</h2>
        <p className="form__group-hint">
          Everything except Active signs the agent out as it saves — the API clears their session
          rather than letting them work until the token expires.
        </p>

        <div className="form__grid">
          <label className="field2">
            <span className="field2__label">Status</span>
            <select
              className="field2__input"
              value={form.status}
              onChange={(event) => set('status', event.target.value)}
            >
              {EDIT_STATUS_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="field2__hint">{statusNote(form.status)}</span>
          </label>

          {/* Only once it has actually moved — a reason for a status nobody
              changed is a box that invites a stale note. */}
          {statusChanged && (
            <label className="field2 field2--full">
              <span className="field2__label">Reason</span>
              <textarea
                className="field2__input field2__input--area"
                value={form.reason}
                maxLength={500}
                rows={2}
                placeholder="Enter why this is changing"
                onChange={(event) => set('reason', event.target.value)}
              />
              <span className="field2__hint">
                Stored on the account and in the audit trail. A suspension nobody can explain is one
                nobody can safely lift.
              </span>
            </label>
          )}
        </div>

        {statusChanged && (
          <p className="notice" role="status">
            <Icon name="alert" size={15} />
            {agent.fullName} moves from {agent.status} to {form.status}
            {form.status === 'active'
              ? ' and can sign in again.'
              : ' and is signed out of every device.'}
          </p>
        )}
      </section>

      <div className="form__actions">
        <button className="btn" type="button" disabled={saving} onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn--primary" type="submit" disabled={saving}>
          <Icon name={saving ? 'refresh' : 'check'} size={14} />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

export default AgentEditForm;
