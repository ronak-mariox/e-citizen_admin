import Icon from '../dashboard/Icon.jsx';
import { EDIT_STATUS_OPTIONS, STATUS_OPTIONS, statusNote } from '../../constants/serviceForm.js';

/* Whether citizens can see this service, and apply for it.

   Last on the form on purpose: it is the one field whose right answer depends
   on everything above it. Deciding to go live before the fee is set or the form
   is built is how a half-configured service ends up in the catalogue.

   Two states, the same two on create and on edit: a service is in the
   catalogue or it is not. The API agrees — see CREATABLE_STATUSES in the
   service validator. */

export function ServicePublishing({ value, editing = false, fieldCount, onChange }) {
  const options = editing ? EDIT_STATUS_OPTIONS : STATUS_OPTIONS;

  // Going live with nothing to fill in is legal — an offline service may only
  // need the catalogue entry — but it is worth saying out loud.
  const emptyAndLive = value === 'active' && fieldCount === 0;

  return (
    <section className="form__group">
      <h2 className="form__group-title">Publishing</h2>
      <p className="form__group-hint">
        An inactive service is invisible to citizens and cannot take applications, but can be built
        out in the meantime.
      </p>

      <div className="form__grid">
        <label className="field2">
          <span className="field2__label">Status</span>
          <select
            className="field2__input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          >
            {options.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="field2__hint">{statusNote(value)}</span>
        </label>
      </div>

      {emptyAndLive && (
        <p className="notice" role="status">
          <Icon name="alert" size={15} />
          This will go live with no application form — a citizen would submit an empty application.
          Add the questions the department needs, or save it as a draft for now.
        </p>
      )}
    </section>
  );
}

export default ServicePublishing;
