import { useEffect, useState } from 'react';

import Icon from './Icon.jsx';
import {
  DOCUMENT_OPTIONS,
  MOBILE_PATTERN,
  REQUIRED_DOCUMENTS,
  STATUS_OPTIONS,
  buildAgentPayload,
  emptyAgentForm,
  findLevel,
  previewEmployeeId,
} from '../../constants/agentForm.js';
import * as departmentsApi from '../../api/departments.js';
import { getErrorMessage } from '../../api/client.js';

/* Create an Agent 1 or an Agent 2 — the login account only.

   Personal details, address, bank account and KYC uploads are the agent's own
   to complete from their app after the first sign-in, so the admin is not asked
   for them. Work scope stays here because it is what routes applications.

   Departments come from the API rather than a constant. They have to: the
   posting is sent as a Mongo id and the employee ID is built from the
   department's code, so a hard-coded list would be offering choices the server
   has never heard of.

   Required and format rules are the browser's own (`required`, `pattern`), so
   the field that is wrong is the field that gets focused. */

/* Archived departments are refused server-side — they cannot gain staff — so
   they are not offered. Draft ones are allowed but flagged, because posting an
   agent to a department citizens cannot yet see is usually onboarding getting
   ahead of the catalogue rather than a mistake. */
const isPostable = (department) => department.status !== 'archived';

export function AgentForm({ level, onSubmit, onCancel, saving = false }) {
  const chosen = findLevel(level);
  const [form, setForm] = useState(emptyAgentForm);

  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // MAX_LIMIT on the API. A dropdown that silently stops at 20 would hide
    // departments an admin knows exist, which reads as a bug in the list.
    departmentsApi
      .listDepartments({ limit: 100 })
      .then((data) => {
        if (!cancelled) setDepartments(data.departments.filter(isPostable));
      })
      .catch((error) => {
        if (!cancelled) setDepartmentError(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoadingDepartments(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const toggleService = (id) =>
    set(
      'services',
      form.services.includes(id)
        ? form.services.filter((item) => item !== id)
        : [...form.services, id]
    );

  const toggleDocument = (type) =>
    set(
      'documents',
      form.documents.includes(type)
        ? form.documents.filter((item) => item !== type)
        : [...form.documents, type]
    );

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(buildAgentPayload(form, level));
  };

  const posting = departments.find((item) => item._id === form.department);

  // Drives the employee-ID preview — the department's code is its segment of it.
  const departmentCode = posting?.code;

  /* Only the services of the chosen department can be assigned, and there is no
     services endpoint yet — so this stays empty and the field explains what an
     empty scope means rather than pretending to offer a choice. */
  const services = [];

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="form__lead">
        Creating an <strong>{chosen.label}</strong> — {chosen.duties.toLowerCase()}. They complete
        their own profile after the first sign-in.
      </p>

      {/* ----------------------------------------------------- login account */}
      <section className="form__group">
        <h2 className="form__group-title">Login account</h2>
        <p className="form__group-hint">
          Agents sign in with an employee ID and a password, never with an OTP.
        </p>

        <div className="form__grid">
          <label className="field2">
            <span className="field2__label">Full name *</span>
            <input
              className="field2__input"
              value={form.fullName}
              maxLength={120}
              placeholder="Ravi Kumar"
              required
              onChange={(event) => set('fullName', event.target.value)}
            />
          </label>

          {/* Issued, not typed. The department decides the middle segment and
              the API allocates the sequence at the moment of insert, so there
              is nothing here for an admin to get wrong or to collide on. */}
          <div className="field2">
            <span className="field2__label">Employee ID</span>
            <p className="field2__static field2__static--code">
              {previewEmployeeId(departmentCode, level)}
            </p>
            <span className="field2__hint">
              {form.department
                ? 'Assigned when the account is created. This is what the agent signs in with.'
                : 'Built from the department below — pick one to see it.'}
            </span>
          </div>

          <label className="field2">
            <span className="field2__label">Mobile number *</span>
            <input
              className="field2__input"
              type="tel"
              value={form.mobile}
              maxLength={10}
              pattern={MOBILE_PATTERN}
              placeholder="9876543210"
              required
              onChange={(event) => set('mobile', event.target.value)}
            />
            <span className="field2__hint">Password-reset OTPs are sent here.</span>
          </label>

          <label className="field2">
            <span className="field2__label">Temporary password *</span>
            <input
              className="field2__input"
              type="password"
              value={form.password}
              minLength={8}
              maxLength={72}
              required
              onChange={(event) => set('password', event.target.value)}
            />
            <span className="field2__hint">8–72 characters, with a letter and a number.</span>
          </label>

          <label className="field2">
            <span className="field2__label">Account status</span>
            <select
              className="field2__input"
              value={form.status}
              onChange={(event) => set('status', event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="field2">
            <span className="field2__label">Role</span>
            <p className="field2__static">{chosen.role}</p>
            <span className="field2__hint">Set by the level you picked.</span>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- work scope */}
      <section className="form__group">
        <h2 className="form__group-title">Work scope</h2>
        <p className="form__group-hint">Decides which applications can be routed to this agent.</p>

        <div className="form__grid">
          <label className="field2">
            <span className="field2__label">Department *</span>
            <select
              className="field2__input"
              value={form.department}
              required
              disabled={loadingDepartments || Boolean(departmentError)}
              onChange={(event) => {
                set('department', event.target.value);
                set('services', []);
              }}
            >
              <option value="">
                {loadingDepartments ? 'Loading departments…' : 'Select…'}
              </option>
              {departments.map((department) => (
                <option value={department._id} key={department._id}>
                  {department.name} ({department.code})
                  {department.status === 'draft' ? ' — draft' : ''}
                </option>
              ))}
            </select>

            {/* The dropdown being empty has three different causes and three
                different fixes, so it says which one it is. */}
            {departmentError && (
              <span className="field2__hint field2__hint--error">
                Could not load departments — {departmentError}
              </span>
            )}
            {!loadingDepartments && !departmentError && departments.length === 0 && (
              <span className="field2__hint field2__hint--error">
                No departments exist yet. Create one under Departments first — an agent cannot be
                posted without it, and their employee ID is built from its code.
              </span>
            )}
            {!loadingDepartments && !departmentError && departments.length > 0 && (
              <span className="field2__hint">Decides the agent&apos;s employee ID and routing.</span>
            )}
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
                {posting
                  ? `No services are set up for ${posting.name} yet, so this agent can be assigned any of them once there are.`
                  : 'Pick a department first.'}
              </p>
            )}

            <span className="field2__hint">
              Leave empty to allow every service in the department.
            </span>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- documents */}
      <section className="form__group">
        <h2 className="form__group-title">Onboarding documents</h2>
        <p className="form__group-hint">
          Tick what has been collected — the agent uploads the files themselves later. Marked{' '}
          <span className="chip__star">*</span> are expected for an {chosen.label}.
        </p>

        <div className="chips chips--spaced">
          {DOCUMENT_OPTIONS.map((document) => {
            const isOn = form.documents.includes(document.value);
            const expected = REQUIRED_DOCUMENTS[level].includes(document.value);

            return (
              <button
                className={isOn ? 'chip chip--on' : 'chip'}
                type="button"
                key={document.value}
                aria-pressed={isOn}
                onClick={() => toggleDocument(document.value)}
              >
                {isOn && <Icon name="check" size={12} />}
                {document.label}
                {expected && <span className="chip__star">*</span>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="form__actions">
        <button className="btn" type="button" disabled={saving} onClick={onCancel}>
          Cancel
        </button>
        {/* Disabled while in flight — a second click would open a second
            account, and both the mobile number and the employee ID are unique,
            so the duplicate would burn a sequence number on its way to a 409. */}
        <button
          className="btn btn--primary"
          type="submit"
          disabled={saving || loadingDepartments || departments.length === 0}
        >
          <Icon name={saving ? 'refresh' : 'check'} size={14} />
          {saving ? 'Creating…' : `Create ${chosen.label}`}
        </button>
      </div>
    </form>
  );
}

export default AgentForm;
