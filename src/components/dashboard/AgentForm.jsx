import { useEffect, useState } from 'react';

import Icon from './Icon.jsx';
import {
  DOCUMENT_OPTIONS,
  MOBILE_PATTERN,
  STATUS_OPTIONS,
  buildAgentPayload,
  emptyAgentForm,
  findLevel,
  previewEmployeeId,
} from '../../constants/agentForm.js';
import * as departmentsApi from '../../api/departments.js';
import * as servicesApi from '../../api/services.js';
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

/* Only an active department can gain staff — the API refuses the rest, so
   offering them would be offering a choice that cannot be saved. */
const isPostable = (department) => department.status === 'active';

export function AgentForm({ level, onSubmit, onCancel, saving = false }) {
  const chosen = findLevel(level);
  const [form, setForm] = useState(() => emptyAgentForm(level));

  /* The admin has to read this password back to the agent, so they need to see
     what they typed — a temporary password mistyped behind dots is an account
     nobody can sign into and a support call to find out why. */
  const [showPassword, setShowPassword] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState(null);

  /* The chosen department's catalogue. Fetched per department rather than all
     at once: an agent can only be scoped to services their own department owns
     — the API refuses the rest — so the whole list would mostly be choices that
     cannot be saved. */
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

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

  /* Reruns whenever the posting changes. The chips below belong to the previous
     department until this lands, which is why choosing one also clears the
     selection — see the department select's onChange. */
  useEffect(() => {
    let cancelled = false;

    if (!form.department) return undefined;

    // The spinner has to appear when the request starts, not when it finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setLoadingServices(true);

    servicesApi
      .listServices({ limit: 100, department: form.department })
      .then((data) => {
        if (!cancelled) setServices(data.services);
      })
      .catch(() => {
        // The field reads "none yet" either way, and the department select
        // above is already reporting whether the API is reachable.
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.department]);

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
              placeholder="Enter the agent's full name"
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
              inputMode="numeric"
              value={form.mobile}
              maxLength={10}
              pattern={MOBILE_PATTERN}
              placeholder="Enter a 10-digit mobile number"
              required
              /* `type="tel"` is a hint about the keyboard, not a filter — it
                 accepts letters like any text box, and `pattern` only speaks up
                 at submit. Dropping non-digits as they are typed means the
                 field can only ever hold what the API will accept. */
              onChange={(event) => set('mobile', event.target.value.replace(/\D/g, ''))}
            />
            <span className="field2__hint">
              10 digits, starting 6–9. Password-reset OTPs are sent here.
            </span>
          </label>

          <label className="field2">
            <span className="field2__label">Email address *</span>
            <input
              className="field2__input"
              type="email"
              value={form.email}
              maxLength={120}
              placeholder="Enter the work email address"
              required
              onChange={(event) => set('email', event.target.value)}
            />
            <span className="field2__hint">
              Unique across staff. The agent can start a password reset with this instead of
              their employee ID — the code still goes to the mobile above.
            </span>
          </label>

          <label className="field2">
            <span className="field2__label">Temporary password *</span>

            <span className="field2__control">
              <input
                className="field2__input field2__input--with-action"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
                onChange={(event) => set('password', event.target.value)}
              />
              {/* Inside the label, so it cannot be tabbed past unnoticed — but
                  type="button", or it would submit the form. */}
              <button
                className="field2__toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
              </button>
            </span>

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
                setServices([]);
              }}
            >
              <option value="">
                {loadingDepartments ? 'Loading departments…' : 'Select…'}
              </option>
              {departments.map((department) => (
                <option value={department._id} key={department._id}>
                  {department.name} ({department.code})
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
                {!posting && 'Pick a department first.'}
                {posting && loadingServices && `Loading ${posting.name} services…`}
                {posting &&
                  !loadingServices &&
                  `No services are set up for ${posting.name} yet, so this agent can be assigned any of them once there are.`}
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
        <h2 className="form__group-title">Required documents</h2>
        <p className="form__group-hint">
          What this {chosen.label} must hand in. Their console asks for exactly these the first
          time they sign in, and will not open the dashboard until every one is uploaded.
        </p>

        <div className="chips chips--spaced">
          {DOCUMENT_OPTIONS.map((document) => {
            const isOn = form.documents.includes(document.value);

            return (
              <button
                className={isOn ? 'chip chip--on' : 'chip'}
                type="button"
                key={document.value}
                aria-pressed={isOn}
                title={document.hint}
                onClick={() => toggleDocument(document.value)}
              >
                {isOn && <Icon name="check" size={12} />}
                {document.label}
              </button>
            );
          })}
        </div>

        {/* The education chip is the one that needs saying out loud — it is a
            choice of three the agent makes, not three separate uploads. */}
        <span className="field2__hint">
          The education certificate can be the 10th, the 12th or a graduation certificate — the
          agent sends whichever they have, and their console records which.
        </span>

        {/* An empty list is allowed and is a real choice — but it is also what
            an accidental double-click leaves behind, so it says so out loud
            rather than letting the admin find out from the agent. */}
        <span className="field2__hint">
          {form.documents.length === 0
            ? 'Nothing ticked — this agent goes straight to their dashboard without uploading anything.'
            : `${form.documents.length} document${form.documents.length === 1 ? '' : 's'} will be asked for at first sign-in.`}
        </span>
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
