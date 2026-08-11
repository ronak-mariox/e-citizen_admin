import { useState } from 'react';

import Icon from '../dashboard/Icon.jsx';
import { OPTION_TYPES, fieldTypeLabel } from '../../constants/serviceForm.js';

/* `dependsOn` — the rule that keeps a field off the screen until it is relevant.

   Stored exactly as the schema holds it: a `field` key and an `equals` array of
   strings. The array is why the values are offered as chips when the parent is
   a dropdown — "show when marital status is married OR divorced" is one rule,
   not two fields.

   Only fields above this one are offered. A rule pointing at a question the
   citizen has not reached yet can never be true, and the preview would just
   show a field that never appears. */

export function ConditionalFieldEditor({ dependsOn, candidates, error, onChange }) {
  const [open, setOpen] = useState(Boolean(dependsOn.field));

  const parent = candidates.find((candidate) => candidate.key === dependsOn.field);
  const parentOptions = parent && OPTION_TYPES.includes(parent.type) ? parent.options : null;

  const setField = (key) => onChange({ field: key, equals: [] });

  const toggleValue = (value) =>
    onChange({
      ...dependsOn,
      equals: dependsOn.equals.includes(value)
        ? dependsOn.equals.filter((current) => current !== value)
        : [...dependsOn.equals, value],
    });

  // A parent that is not a list has no values to offer, so they are typed —
  // comma-separated, because `equals` is an array either way.
  const setTypedValues = (text) =>
    onChange({ ...dependsOn, equals: text.split(',').map((value) => value.trim()) });

  const clear = () => onChange({ field: '', equals: [] });

  return (
    <div className="builder__block">
      <button
        className="builder__disclosure"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} />
        Conditional visibility
        {dependsOn.field && <span className="builder__count">on</span>}
      </button>

      {open && (
        <>
          {candidates.length === 0 ? (
            <p className="builder__block-empty">
              Nothing to depend on yet — a field can only react to one that comes before it.
            </p>
          ) : (
            <div className="builder__grid">
              <label className="field2">
                <span className="field2__label">Show this field only when</span>
                <select
                  className="field2__input"
                  value={dependsOn.field}
                  onChange={(event) => setField(event.target.value)}
                >
                  <option value="">Always show it</option>
                  {candidates.map((candidate) => (
                    <option value={candidate.key} key={candidate.key}>
                      #{candidate.displayOrder} {candidate.label || candidate.key} (
                      {fieldTypeLabel(candidate.type)})
                    </option>
                  ))}
                </select>
              </label>

              {dependsOn.field && parentOptions && (
                <div className="field2">
                  <span className="field2__label">…is any of</span>
                  <div className="chips">
                    {parentOptions
                      .filter((option) => option.value)
                      .map((option) => (
                        <button
                          className={
                            dependsOn.equals.includes(option.value) ? 'chip chip--on' : 'chip'
                          }
                          type="button"
                          key={option.value}
                          aria-pressed={dependsOn.equals.includes(option.value)}
                          onClick={() => toggleValue(option.value)}
                        >
                          {option.label || option.value}
                        </button>
                      ))}
                  </div>
                  {parentOptions.every((option) => !option.value) && (
                    <span className="field2__hint">
                      That field has no option values yet — add them first.
                    </span>
                  )}
                </div>
              )}

              {dependsOn.field && !parentOptions && (
                <label className="field2">
                  <span className="field2__label">…equals</span>
                  <input
                    className="field2__input"
                    value={dependsOn.equals.join(', ')}
                    placeholder="Enter the value to match"
                    onChange={(event) => setTypedValues(event.target.value)}
                  />
                  <span className="field2__hint">
                    Separate several values with commas — any one of them shows the field.
                  </span>
                </label>
              )}
            </div>
          )}

          {error && <p className="field2__hint field2__hint--error">{error}</p>}

          {dependsOn.field && (
            <button className="btn btn--sm" type="button" onClick={clear}>
              Clear rule
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default ConditionalFieldEditor;
