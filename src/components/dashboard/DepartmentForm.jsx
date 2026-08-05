import { useState } from 'react';

import Icon from './Icon.jsx';
import {
  ADDRESS_MAX,
  CODE_MAX,
  CODE_PATTERN,
  DESCRIPTION_MAX,
  EDIT_STATUS_OPTIONS,
  EMAIL_MAX,
  NAME_MAX,
  PHONE_MAX,
  STATUS_OPTIONS,
  buildDepartmentPayload,
  buildDepartmentUpdate,
  departmentToForm,
  emptyDepartmentForm,
  slugPreview,
} from '../../constants/departmentForm.js';
import { previewEmployeeId } from '../../constants/agentForm.js';

/* Create or edit a department — the owning body a service belongs to and an
   application is ultimately filed with.

   One component for both, because they are the same fields with one exception:
   the code is set once and then locked, since it is already written into the
   employee ID of every agent the department has hired. Two components would be
   the same form twice with one input different.

   Required and format rules are the browser's own (`required`, `pattern`,
   `maxLength`), so the field that is wrong is the field that gets focused,
   matching AgentForm. */

export function DepartmentForm({ department, onSubmit, onCancel, saving = false }) {
  const editing = Boolean(department);
  const [form, setForm] = useState(() =>
    editing ? departmentToForm(department) : emptyDepartmentForm()
  );

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(editing ? buildDepartmentUpdate(form) : buildDepartmentPayload(form));
  };

  const slug = slugPreview(form.name);
  const statusOptions = editing ? EDIT_STATUS_OPTIONS : STATUS_OPTIONS;

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="form__lead">
        {editing
          ? 'The name and code are fixed — too much already refers to them. Everything else can be changed, and a department that has genuinely become something else is archived and replaced.'
          : 'A department owns services and posts agents. Both can be added once it exists — this is the record itself. Get the name and code right: neither can be changed afterwards.'}
      </p>

      {/* ---------------------------------------------------------- identity */}
      <section className="form__group">
        <h2 className="form__group-title">Identity</h2>
        <p className="form__group-hint">
          {editing
            ? 'Both are set at creation and stay that way — the slug, the audit trail and every employee ID already point at them.'
            : 'The name is what citizens see. The code is what the platform uses internally. Neither can be changed later.'}
        </p>

        <div className="form__grid">
          {editing ? (
            <div className="field2">
              <span className="field2__label">Department name</span>
              <p className="field2__static">{form.name}</p>
              <span className="field2__hint">Locked — /departments/{slug}</span>
            </div>
          ) : (
            <label className="field2">
              <span className="field2__label">Department name *</span>
              <input
                className="field2__input"
                value={form.name}
                maxLength={NAME_MAX}
                placeholder="Revenue"
                required
                onChange={(event) => set('name', event.target.value)}
              />
              <span className="field2__hint">
                {slug
                  ? `Web address: /departments/${slug}. Cannot be changed later.`
                  : 'Must be unique, and cannot be changed later.'}
              </span>
            </label>
          )}

          {/* The one field on this form that can never be corrected later, so
              once the department exists it stops being an input at all. */}
          {editing ? (
            <div className="field2">
              <span className="field2__label">Code</span>
              <p className="field2__static field2__static--code">{form.code}</p>
              <span className="field2__hint">Locked — agents are already numbered under it.</span>
            </div>
          ) : (
            <label className="field2">
              <span className="field2__label">Code *</span>
              <input
                className="field2__input"
                value={form.code}
                maxLength={CODE_MAX}
                pattern={CODE_PATTERN}
                placeholder="REV"
                required
                autoCapitalize="characters"
                spellCheck="false"
                onChange={(event) => set('code', event.target.value.toUpperCase())}
              />
              <span className="field2__hint">
                2–5 letters. <strong>Cannot be changed later</strong> — it is written into the
                employee ID of every agent this department hires.
              </span>
            </label>
          )}

          <div className="field2">
            <span className="field2__label">Agents here will be numbered</span>
            <p className="field2__static field2__static--code">
              {previewEmployeeId(form.code, 'l1')}
            </p>
            <span className="field2__hint">And {previewEmployeeId(form.code, 'l2')} for Agent 2.</span>
          </div>

          <label className="field2 field2--full">
            <span className="field2__label">Description</span>
            <textarea
              className="field2__input field2__input--area"
              value={form.description}
              maxLength={DESCRIPTION_MAX}
              rows={3}
              placeholder="What this department is responsible for, in a sentence or two."
              onChange={(event) => set('description', event.target.value)}
            />
            <span className="field2__hint">Shown to citizens browsing the catalogue.</span>
          </label>
        </div>
      </section>

      {/* ----------------------------------------------------------- contact */}
      <section className="form__group">
        <h2 className="form__group-title">Contact</h2>
        <p className="form__group-hint">
          Where an Agent 2 goes, and who they chase, when an application has to be filed by hand.
        </p>

        <div className="form__grid">
          <label className="field2 field2--full">
            <span className="field2__label">Office address</span>
            <textarea
              className="field2__input field2__input--area"
              value={form.officeAddress}
              maxLength={ADDRESS_MAX}
              rows={2}
              placeholder="Room 214, District Revenue Office, Bengaluru 560001"
              onChange={(event) => set('officeAddress', event.target.value)}
            />
          </label>

          <label className="field2">
            <span className="field2__label">Contact email</span>
            <input
              className="field2__input"
              type="email"
              value={form.contactEmail}
              maxLength={EMAIL_MAX}
              placeholder="revenue@ecitizen.gov.in"
              onChange={(event) => set('contactEmail', event.target.value)}
            />
          </label>

          <label className="field2">
            <span className="field2__label">Contact phone</span>
            <input
              className="field2__input"
              type="tel"
              value={form.contactPhone}
              maxLength={PHONE_MAX}
              placeholder="080 2222 1100"
              onChange={(event) => set('contactPhone', event.target.value)}
            />
            <span className="field2__hint">A desk line, not a personal mobile.</span>
          </label>
        </div>
      </section>

      {/* -------------------------------------------------------- publishing */}
      <section className="form__group">
        <h2 className="form__group-title">Publishing</h2>
        <p className="form__group-hint">
          A draft department is invisible to citizens and cannot take applications, but can be built
          out in the meantime.
        </p>

        <div className="form__grid">
          <label className="field2">
            <span className="field2__label">Status</span>
            <select
              className="field2__input"
              value={form.status}
              onChange={(event) => set('status', event.target.value)}
            >
              {statusOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field2">
            <span className="field2__label">Display order</span>
            <input
              className="field2__input"
              type="number"
              value={form.displayOrder}
              min={0}
              step={1}
              onChange={(event) => set('displayOrder', event.target.value)}
            />
            <span className="field2__hint">Lower sorts first. Ties fall back to name.</span>
          </label>

          <label className="field2">
            <span className="field2__label">Icon</span>
            <input
              className="field2__input"
              value={form.icon}
              maxLength={100}
              placeholder="departments"
              onChange={(event) => set('icon', event.target.value)}
            />
            <span className="field2__hint">Optional — an icon key for the citizen app.</span>
          </label>
        </div>
      </section>

      <div className="form__actions">
        <button className="btn" type="button" disabled={saving} onClick={onCancel}>
          Cancel
        </button>
        {/* Disabled while in flight — a second click would open a second
            department, and the name and code are both unique. */}
        <button className="btn btn--primary" type="submit" disabled={saving}>
          <Icon name={saving ? 'refresh' : 'check'} size={14} />
          {saving && (editing ? 'Saving…' : 'Creating…')}
          {!saving && (editing ? 'Save changes' : 'Create department')}
        </button>
      </div>
    </form>
  );
}

export default DepartmentForm;
