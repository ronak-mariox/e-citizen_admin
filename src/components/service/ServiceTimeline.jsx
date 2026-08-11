import Icon from '../dashboard/Icon.jsx';
import {
  MAX_PROCESSING_DAYS,
  MAX_SLA_HOURS,
  slaLabel,
  validateTimeline,
} from '../../constants/serviceForm.js';

/* How long the service takes — two promises, made to two different people.

   `processingDays` is the range quoted to the citizen on the service page, and
   it covers the department's own turnaround, which nobody here controls.
   `slaHours` is the internal target: the clock an agent is measured against,
   and a breach feeds their performance. They are not the same number, and a
   console that offered one field for both would be quietly picking which of the
   two promises to break. */

export function ServiceTimeline({ timeline, onChange }) {
  const set = (name, value) => onChange({ ...timeline, [name]: value });
  const error = validateTimeline(timeline);

  return (
    <section className="form__group">
      <h2 className="form__group-title">Timeline</h2>
      <p className="form__group-hint">
        What the citizen is told, and what the agent handling it is held to.
      </p>

      <div className="form__grid">
        <label className="field2">
          <span className="field2__label">Processing time — fastest (days)</span>
          <input
            className="field2__input"
            type="number"
            value={timeline.processingMinDays}
            min={0}
            max={MAX_PROCESSING_DAYS}
            step={1}
            onChange={(event) => set('processingMinDays', event.target.value)}
          />
          <span className="field2__hint">Quoted to the citizen before they apply.</span>
        </label>

        <label className="field2">
          <span className="field2__label">Processing time — slowest (days)</span>
          <input
            className="field2__input"
            type="number"
            value={timeline.processingMaxDays}
            min={0}
            max={MAX_PROCESSING_DAYS}
            step={1}
            onChange={(event) => set('processingMaxDays', event.target.value)}
          />
          <span className="field2__hint">
            The honest worst case. Quoting the best case is what turns a slow service into a
            complaint.
          </span>
        </label>

        <label className="field2">
          <span className="field2__label">SLA (hours)</span>
          <input
            className="field2__input"
            type="number"
            value={timeline.slaHours}
            min={0}
            max={MAX_SLA_HOURS}
            step={1}
            onChange={(event) => set('slaHours', event.target.value)}
          />
          <span className="field2__hint">
            {slaLabel(timeline.slaHours)} — the internal target for verifying and filing. A breach
            counts against the agent, not the department.
          </span>
        </label>
      </div>

      {error && (
        <p className="notice notice--error" role="alert">
          <Icon name="alert" size={15} />
          {error}
        </p>
      )}
    </section>
  );
}

export default ServiceTimeline;
