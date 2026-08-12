import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import Icon from '../dashboard/Icon.jsx';
import {
  FILE_MIME_TYPES,
  groupBySection,
  isFieldVisible,
  previewPlaceholder,
} from '../../constants/serviceForm.js';

/* The citizen's view of the form being built, rendered from the same state the
   builder edits — there is no second copy of the field list here, which is the
   only way a preview can be trusted.

   It answers its own questions. `dependsOn` is a rule about what the citizen
   has typed, so the only way to show whether it works is to let the admin type
   into the preview and watch the dependent field appear.

   Portalled to the body for the same reason ConfirmDialog is: below 900px the
   sidebar is a transformed drawer, and a transform makes its subtree the
   containing block for `position: fixed`. */

function PreviewInput({ field, value, onChange }) {
  const common = {
    className: 'field2__input',
    // The admin's wording when they gave one, an instruction derived from the
    // field's type and label when they did not.
    placeholder: previewPlaceholder(field),
    id: `preview-${field.key || field.uid}`,
  };

  switch (field.type) {
    case 'textarea':
    case 'address':
      return (
        <textarea
          {...common}
          className="field2__input field2__input--area"
          rows={field.type === 'address' ? 3 : 4}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case 'number':
      return (
        <input
          {...common}
          type="number"
          min={field.validation.min === '' ? undefined : field.validation.min}
          max={field.validation.max === '' ? undefined : field.validation.max}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case 'date':
      return (
        <input
          {...common}
          type="date"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case 'email':
      return (
        <input
          {...common}
          type="email"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case 'mobile':
      return (
        <input
          {...common}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={value ?? ''}
          // Digits only, the same as the citizen app — a preview that accepts
          // what the real form refuses is not showing the real form.
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        />
      );

    case 'select':
      return (
        <select {...common} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">{previewPlaceholder(field)}</option>
          {field.options
            .filter((option) => option.value)
            .map((option) => (
              <option value={option.value} key={option.value}>
                {option.label || option.value}
              </option>
            ))}
        </select>
      );

    case 'multiselect': {
      const chosen = Array.isArray(value) ? value : [];

      return (
        <div className="chips">
          {field.options
            .filter((option) => option.value)
            .map((option) => (
              <button
                className={chosen.includes(option.value) ? 'chip chip--on' : 'chip'}
                type="button"
                key={option.value}
                aria-pressed={chosen.includes(option.value)}
                onClick={() =>
                  onChange(
                    chosen.includes(option.value)
                      ? chosen.filter((current) => current !== option.value)
                      : [...chosen, option.value]
                  )
                }
              >
                {option.label || option.value}
              </button>
            ))}
        </div>
      );
    }

    case 'radio':
      return (
        <div className="preview__radios">
          {field.options
            .filter((option) => option.value)
            .map((option) => (
              <label className="preview__radio" key={option.value}>
                <input
                  type="radio"
                  name={`preview-${field.uid}`}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
                <span>{option.label || option.value}</span>
              </label>
            ))}
        </div>
      );

    case 'checkbox':
      return (
        <label className="preview__radio">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(event) => onChange(event.target.checked ? 'true' : '')}
          />
          <span>{field.placeholder || field.label}</span>
        </label>
      );

    case 'file': {
      const formats = (field.file?.allowedMimeTypes ?? [])
        .map((mime) => FILE_MIME_TYPES.find((known) => known.value === mime)?.label ?? mime)
        .join(', ');
      const files = Number(field.file?.maxFiles ?? 1);

      return (
        <div className="preview__file">
          <Icon name="download" size={15} />
          <span>
            {files > 1
              ? `${previewPlaceholder(field)} — up to ${files} files`
              : previewPlaceholder(field)}
          </span>
          {/* The rules are part of the control, not a caption on it — a citizen
              finds out what is accepted before picking, not after sending. */}
          <span className="preview__file-rules">
            {formats || 'No format accepted'} · up to {field.file?.maxSizeMb ?? 5} MB
            {field.file?.documentType && field.file?.acceptFromLocker
              ? ' · can come from your locker'
              : ''}
          </span>
        </div>
      );
    }

    default:
      return (
        <input
          {...common}
          type="text"
          maxLength={field.validation.maxLength === '' ? undefined : Number(field.validation.maxLength)}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}

export function FormPreview({ serviceName, fields, onClose }) {
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const visible = fields.filter((field) => isFieldVisible(field, answers));
  const hidden = fields.length - visible.length;
  const groups = groupBySection(visible);

  const answer = (field, value) =>
    setAnswers((current) => ({ ...current, [field.key || field.uid]: value }));

  return createPortal(
    <div className="modal" role="presentation" onClick={onClose}>
      <div
        className="modal__card modal__card--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="preview__head">
          <div>
            <h2 className="modal__title" id="preview-title">
              {serviceName || 'Untitled service'}
            </h2>
            <p className="preview__lead">
              What a citizen sees when they apply. Type into it — conditional fields react.
            </p>
          </div>

          <button className="icon-button" type="button" aria-label="Close preview" onClick={onClose}>
            <Icon name="ban" size={16} />
          </button>
        </header>

        <div className="preview__body">
          {fields.length === 0 && (
            <p className="builder__block-empty">
              No fields yet — the application would be submitted blank.
            </p>
          )}

          {groups.map((group) => (
            <section className="preview__section" key={group.section || 'ungrouped'}>
              {group.section && <h3 className="preview__section-title">{group.section}</h3>}

              {group.fields.map((field) => (
                <div className="preview__field" key={field.uid}>
                  <label
                    className="field2__label"
                    htmlFor={`preview-${field.key || field.uid}`}
                  >
                    {field.label || 'Untitled field'}
                    {field.isRequired && <span className="chip__star"> *</span>}
                  </label>

                  <PreviewInput
                    field={field}
                    value={answers[field.key || field.uid]}
                    onChange={(value) => answer(field, value)}
                  />

                  {field.helpText && <span className="field2__hint">{field.helpText}</span>}
                </div>
              ))}
            </section>
          ))}

          {hidden > 0 && (
            <p className="preview__hidden">
              {hidden} field{hidden === 1 ? '' : 's'} hidden by a conditional rule until the answer
              above matches.
            </p>
          )}
        </div>

        <div className="preview__foot">
          {/* Inert on purpose: this is what the button looks like, not a way to
              apply for anything. */}
          <button className="btn btn--primary" type="button" disabled>
            Submit application
          </button>
          <button className="btn" type="button" onClick={onClose}>
            Close preview
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default FormPreview;
