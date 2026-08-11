import { FIELD_TYPES } from '../../constants/serviceForm.js';

/* The one control that decides what the rest of a field card looks like.

   A plain <select> rather than a grid of tiles: there are twelve types, the
   card is already dense, and changing the type is a thing an admin does once
   per field. The hint under it is the chosen type's own, so the consequence of
   the choice is readable without switching to the preview. */

export function FieldTypeSelector({ value, error, onChange }) {
  const chosen = FIELD_TYPES.find((type) => type.value === value);

  return (
    <label className="field2">
      <span className="field2__label">Data type *</span>
      <select
        className="field2__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {FIELD_TYPES.map((type) => (
          <option value={type.value} key={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {error ? (
        <span className="field2__hint field2__hint--error">{error}</span>
      ) : (
        <span className="field2__hint">{chosen?.hint}</span>
      )}
    </label>
  );
}

export default FieldTypeSelector;
