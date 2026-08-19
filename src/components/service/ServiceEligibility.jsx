import Icon from '../dashboard/Icon.jsx';
import {
  ELIGIBILITY_CATEGORIES,
  ELIGIBILITY_GENDERS,
} from '../../constants/serviceForm.js';

/* Who may apply.

   Everything here is optional, and left alone it stays that way: a service open
   to everyone says nothing rather than saying "anyone", because the two read
   differently on the citizen's service page. The one exception is the KYC
   toggle, which is a decision either way and is always sent.

   The criteria list is the part citizens actually read — the summary sets the
   scene, the bullets are what they check themselves against. */

export function ServiceEligibility({ eligibility, onChange }) {
  const set = (name, value) => onChange({ ...eligibility, [name]: value });

  const setCriterion = (index, value) =>
    set(
      'criteria',
      eligibility.criteria.map((entry, position) => (position === index ? value : entry))
    );

  const addCriterion = () => set('criteria', [...eligibility.criteria, '']);

  const removeCriterion = (index) =>
    set(
      'criteria',
      eligibility.criteria.filter((_, position) => position !== index)
    );

  const toggleCategory = (value) =>
    set(
      'categories',
      eligibility.categories.includes(value)
        ? eligibility.categories.filter((entry) => entry !== value)
        : [...eligibility.categories, value]
    );

  return (
    <section className="form__group">
      <h2 className="form__group-title">Eligibility</h2>
      <p className="form__group-hint">
        Shown on the service page before a citizen starts an application. Leave a field empty
        and it is not a rule — an empty section means the service is open to everyone.
      </p>

      <div className="form__grid">
        <label className="field2 field2--full">
          <span className="field2__label">Summary</span>
          <textarea
            className="field2__input field2__input--area"
            value={eligibility.summary}
            maxLength={2000}
            rows={3}
            placeholder="Describe in a sentence or two who this service is for"
            onChange={(event) => set('summary', event.target.value)}
          />
        </label>

        <div className="field2 field2--full">
          <span className="field2__label">Criteria</span>
          <span className="field2__hint">
            One condition per line, as the citizen should check themselves against.
          </span>

          {eligibility.criteria.length > 0 && (
            <div className="repeater">
              {eligibility.criteria.map((criterion, index) => (
                // Position is the identity here — these are plain strings, and
                // a criterion has nothing stabler to key on.
                <div className="repeater__row" key={index}>
                  <input
                    className="field2__input"
                    value={criterion}
                    maxLength={500}
                    placeholder="e.g. Resident of the district for at least three years"
                    onChange={(event) => setCriterion(index, event.target.value)}
                  />
                  <button
                    className="icon-button icon-button--danger"
                    type="button"
                    aria-label={`Remove criterion ${index + 1}`}
                    onClick={() => removeCriterion(index)}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn--quiet btn--sm" type="button" onClick={addCriterion}>
            <Icon name="plus" size={14} />
            Add criterion
          </button>
        </div>

        <label className="field2">
          <span className="field2__label">Minimum age</span>
          <input
            className="field2__input"
            type="number"
            value={eligibility.minAge}
            min={0}
            max={120}
            step={1}
            placeholder="No minimum"
            onChange={(event) => set('minAge', event.target.value)}
          />
        </label>

        <label className="field2">
          <span className="field2__label">Maximum age</span>
          <input
            className="field2__input"
            type="number"
            value={eligibility.maxAge}
            min={0}
            max={120}
            step={1}
            placeholder="No maximum"
            onChange={(event) => set('maxAge', event.target.value)}
          />
        </label>

        <label className="field2">
          <span className="field2__label">Gender</span>
          <select
            className="field2__input"
            value={eligibility.gender}
            onChange={(event) => set('gender', event.target.value)}
          >
            <option value="">No restriction</option>
            {ELIGIBILITY_GENDERS.filter((option) => option.value !== 'any').map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="field2__hint">
            Only set this where the scheme itself is restricted.
          </span>
        </label>

        <label className="field2">
          <span className="field2__label">Income ceiling (₹ per year)</span>
          <input
            className="field2__input"
            type="number"
            value={eligibility.maxAnnualIncome}
            min={0}
            step={1}
            placeholder="No ceiling"
            onChange={(event) => set('maxAnnualIncome', event.target.value)}
          />
          <span className="field2__hint">
            In rupees — this is the department&apos;s means test, not a fee.
          </span>
        </label>

        <div className="field2 field2--full">
          <span className="field2__label">Categories</span>
          <span className="field2__hint">
            Leave all unticked when the service is open regardless of category.
          </span>

          <div className="chips">
            {ELIGIBILITY_CATEGORIES.map((option) => {
              const on = eligibility.categories.includes(option.value);

              return (
                <button
                  className={on ? 'chip chip--on' : 'chip'}
                  type="button"
                  key={option.value}
                  aria-pressed={on}
                  onClick={() => toggleCategory(option.value)}
                >
                  {on && <Icon name="check" size={12} />}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="field2 field2--full field2--inline">
          <input
            type="checkbox"
            checked={eligibility.requiresKyc}
            onChange={(event) => set('requiresKyc', event.target.checked)}
          />
          <span>
            <span className="field2__label">Requires a KYC-verified citizen</span>
            <span className="field2__hint">
              On by default. Turn it off only for services a citizen can apply for before their
              identity has been verified.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}

export default ServiceEligibility;
