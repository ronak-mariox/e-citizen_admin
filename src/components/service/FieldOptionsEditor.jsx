import Icon from '../dashboard/Icon.jsx';
import { createOption, keyFromLabel } from '../../constants/serviceForm.js';

/* The list behind a dropdown, multi-select or radio group.

   Two columns, because the schema stores two: the label is what the citizen
   reads and the value is what is written into the application — renaming
   "Male" to "Male (M)" later must not change what every stored application
   says. The value is suggested from the label and then left alone, so an admin
   who does not care about the distinction never has to think about it, and one
   who does is not fighting the field. */

export function FieldOptionsEditor({ options, error, onChange }) {
  const setOption = (index, part, value) =>
    onChange(options.map((option, at) => (at === index ? { ...option, [part]: value } : option)));

  const setLabel = (index, label) => {
    const option = options[index];
    // Only while the value is still what the label suggested — the moment it is
    // edited by hand it stops being derived.
    const derived = option.value === '' || option.value === keyFromLabel(option.label);

    onChange(
      options.map((current, at) =>
        at === index
          ? { ...current, label, value: derived ? keyFromLabel(label) : current.value }
          : current
      )
    );
  };

  const add = () => onChange([...options, createOption()]);
  const remove = (index) => onChange(options.filter((_, at) => at !== index));

  return (
    <div className="builder__block">
      <div className="builder__block-head">
        <span className="builder__block-title">Options</span>
        <span className="builder__block-hint">
          The label is read by the citizen; the value is what the application stores.
        </span>
      </div>

      {options.length === 0 && (
        <p className="builder__block-empty">
          No options yet — a dropdown with nothing in it cannot be answered.
        </p>
      )}

      {options.map((option, index) => (
        // Index-keyed on purpose: an option has no identity of its own until it
        // has a value, and every input here is controlled, so a row that shifts
        // up after a removal re-renders with the right value anyway.
        <div className="option-row" key={index}>
          <span className="option-row__index">{index + 1}</span>

          <label className="field2">
            <span className="field2__label">Label</span>
            <input
              className="field2__input"
              value={option.label}
              maxLength={160}
              placeholder="Enter the option label"
              onChange={(event) => setLabel(index, event.target.value)}
            />
          </label>

          <label className="field2">
            <span className="field2__label">Value</span>
            <input
              className="field2__input"
              value={option.value}
              maxLength={160}
              placeholder="Enter the stored value"
              spellCheck="false"
              onChange={(event) => setOption(index, 'value', event.target.value)}
            />
          </label>

          <button
            className="icon-button icon-button--danger"
            type="button"
            aria-label={`Remove option ${index + 1}`}
            onClick={() => remove(index)}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ))}

      {error && <p className="field2__hint field2__hint--error">{error}</p>}

      <button className="btn btn--sm" type="button" onClick={add}>
        <Icon name="plus" size={13} />
        Add option
      </button>
    </div>
  );
}

export default FieldOptionsEditor;
