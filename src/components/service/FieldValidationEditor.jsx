import { useState } from 'react';

import Icon from '../dashboard/Icon.jsx';
import { VALIDATION_LABELS, validationKeysFor } from '../../constants/serviceForm.js';

/* The `validation` object, one input per key the chosen type can use.

   Collapsed by default: most fields need none of it, and five more inputs on
   every card would bury the two that decide whether the field works at all.
   Which keys appear is the type's business — a pattern on a date picker would
   be stored and then never mean anything, so it is not offered.

   `pattern` is checked as it is typed. A regular expression that does not
   compile is not a validation rule, it is a field the citizen can never get
   past, and that is worth catching here rather than in production. */

const patternError = (source) => {
  if (!source.trim()) return null;

  try {
    // Compiled for its throw, not its value.
    RegExp(source);
    return null;
  } catch (error) {
    return error.message;
  }
};

export function FieldValidationEditor({ type, validation, onChange }) {
  const [open, setOpen] = useState(false);
  const keys = validationKeysFor(type);

  if (keys.length === 0) {
    return null;
  }

  const set = (key, value) => onChange({ ...validation, [key]: value });

  // How many rules are actually set, so a collapsed section still says whether
  // there is anything inside it.
  const active = keys.filter((key) => String(validation[key] ?? '').trim() !== '').length;
  const badPattern = keys.includes('pattern') ? patternError(String(validation.pattern ?? '')) : null;

  return (
    <div className="builder__block">
      <button
        className="builder__disclosure"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} />
        Advanced validation
        {active > 0 && <span className="builder__count">{active}</span>}
      </button>

      {open && (
        <div className="builder__grid">
          {keys.map((key) => (
            <label className="field2" key={key}>
              <span className="field2__label">{VALIDATION_LABELS[key]}</span>
              <input
                className="field2__input"
                type={key === 'pattern' ? 'text' : 'number'}
                value={validation[key] ?? ''}
                min={key === 'minLength' || key === 'maxLength' ? 0 : undefined}
                placeholder={key === 'pattern' ? 'Enter a regular expression' : ''}
                spellCheck="false"
                onChange={(event) => set(key, event.target.value)}
              />
              {key === 'pattern' && (
                <span className={badPattern ? 'field2__hint field2__hint--error' : 'field2__hint'}>
                  {badPattern
                    ? `Not a usable expression — ${badPattern}`
                    : 'A regular expression the answer has to match.'}
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default FieldValidationEditor;
