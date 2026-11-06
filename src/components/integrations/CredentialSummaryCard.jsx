import Icon from '../dashboard/Icon.jsx';
import PanelCard from '../settings/PanelCard.jsx';

const DATE = { day: 'numeric', month: 'short', year: 'numeric' };
const TIME = { hour: '2-digit', minute: '2-digit' };

const stamp = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : `${date.toLocaleDateString('en-IN', DATE)}, ${date.toLocaleTimeString('en-IN', TIME)}`;
};

/**
 * "Current Configuration" — the masked read-only view every integration
 * page opens with. Every value here is already redacted by the backend
 * (`maskCredential`, integrationConfig.service.js); nothing here ever holds
 * a real credential to leak.
 */
export function CredentialSummaryCard({ integration, fieldSchema, provider }) {
  const updated = stamp(integration.updatedAt);

  return (
    <PanelCard title="Current Configuration">
      {!integration.isConfigured && !updated ? (
        <p className="int-summary__empty">
          <Icon name="shield" size={14} />
          Not configured yet — save credentials below to get started.
        </p>
      ) : (
        <div className="int-summary">
          <div className="int-summary__cell">
            <span className="int-summary__label">PROVIDER</span>
            <span className="int-summary__value">{provider.toUpperCase()}</span>
          </div>

          {fieldSchema.map((field) => (
            <div className="int-summary__cell" key={field.key}>
              <span className="int-summary__label">{field.label.toUpperCase()}</span>
              <span className="int-summary__value">{integration.fields[field.key] ?? '—'}</span>
            </div>
          ))}

          <div className="int-summary__cell">
            <span className="int-summary__label">STATUS</span>
            <span
              className={`int-summary__value int-summary__status int-summary__status--${
                integration.isActive ? 'active' : 'inactive'
              }`}
            >
              <Icon name="check" size={13} />
              {integration.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {updated && (
            <div className="int-summary__cell">
              <span className="int-summary__label">LAST UPDATED</span>
              <span className="int-summary__value">{updated}</span>
            </div>
          )}
        </div>
      )}
    </PanelCard>
  );
}

export default CredentialSummaryCard;
