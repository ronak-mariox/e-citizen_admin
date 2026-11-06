import { useState } from 'react';

import Icon from '../dashboard/Icon.jsx';
import PanelCard from '../settings/PanelCard.jsx';

/**
 * "Update Credentials" — one input per field in `fields`, a single Save
 * action. Every field starts blank: a saved value never round-trips back
 * into an editable input (only the masked summary above does), so retyping
 * is the only way to change one — the same "write-only after the first
 * save" discipline the backend already enforces.
 *
 * Built from `.field2`/`.form__grid` (dashboard.css) — the same input
 * styling ProfilePage and AgentForm already use — rather than a parallel
 * set of classes for this one screen. The show/hide toggle on a secret
 * field is the exact `.field2__control`/`.field2__toggle` pattern
 * AgentForm's own password field already uses.
 *
 * Deliberately generic rather than per-integration: Firebase's page uses
 * this twice (its client keys, and — separately — its service-account
 * JSON), and the other three pages use it once.
 */
export function CredentialForm({ title, icon, notice, provider, fields, onSave, submitLabel = 'Save Configuration' }) {
  const [values, setValues] = useState({});
  const [visible, setVisible] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const toggleVisible = (key) =>
    setVisible((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  async function handleSubmit(event) {
    event.preventDefault();

    const filled = Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim() !== ''));

    if (Object.keys(filled).length === 0) return;

    setSaving(true);
    setError(null);

    try {
      await onSave(filled);
      setValues({});
    } catch (failure) {
      setError(failure.message ?? 'Could not save these credentials');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PanelCard title={title}>
      <form className="form" onSubmit={handleSubmit}>
        {notice && (
          <p className="notice notice--info">
            <Icon name={icon ?? 'shield'} size={14} />
            {notice}
          </p>
        )}

        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}

        <div className="form__grid int-form__grid">
          {provider && (
            <label className="field2">
              <span className="field2__label">Provider</span>
              <span className="field2__static">{provider}</span>
            </label>
          )}

          {fields.map((field) => (
            <label className={`field2 ${field.multiline ? 'field2--full' : ''}`} key={field.key}>
              <span className="field2__label">
                {field.label}
                {field.required && ' *'}
                {field.optionalLabel && ` ${field.optionalLabel}`}
              </span>

              {field.multiline ? (
                <textarea
                  className="field2__input field2__input--area"
                  rows={6}
                  value={values[field.key] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(event) => set(field.key, event.target.value)}
                />
              ) : field.secret ? (
                <span className="field2__control">
                  <input
                    className="field2__input field2__input--with-action"
                    type={visible.has(field.key) ? 'text' : 'password'}
                    value={values[field.key] ?? ''}
                    placeholder={field.placeholder}
                    autoComplete="off"
                    onChange={(event) => set(field.key, event.target.value)}
                  />
                  <button
                    className="field2__toggle"
                    type="button"
                    aria-label={visible.has(field.key) ? 'Hide value' : 'Show value'}
                    aria-pressed={visible.has(field.key)}
                    onClick={() => toggleVisible(field.key)}
                  >
                    <Icon name={visible.has(field.key) ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </span>
              ) : (
                <input
                  className="field2__input"
                  type="text"
                  value={values[field.key] ?? ''}
                  placeholder={field.placeholder}
                  autoComplete="off"
                  onChange={(event) => set(field.key, event.target.value)}
                />
              )}

              {field.hint && <span className="field2__hint">{field.hint}</span>}
            </label>
          ))}
        </div>

        <button className="btn btn--primary" type="submit" disabled={saving}>
          <Icon name="save" size={13} />
          {saving ? 'Saving…' : submitLabel}
        </button>
      </form>
    </PanelCard>
  );
}

export default CredentialForm;
