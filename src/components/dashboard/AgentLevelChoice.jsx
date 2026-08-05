import Icon from './Icon.jsx';
import { AGENT_LEVELS } from '../../constants/agentForm.js';

/**
 * Step one of creating an agent — which level the account works at.
 *
 * Asked before the form rather than as a field inside it, because the two
 * levels do different jobs and the answer changes what the rest of the form
 * expects: an Agent 2 visits department counters with citizen papers, so its
 * onboarding wants a police verification and an agreement that an Agent 1's
 * does not. A dropdown halfway down the form would bury that.
 *
 * The level is the only thing that differs between the two accounts — they
 * share one schema, and only `role` changes (backend/src/models/agent.js).
 */
export function AgentLevelChoice({ onSelect }) {
  return (
    <div className="choice-row">
      {AGENT_LEVELS.map((level) => (
        <button
          className="choice"
          type="button"
          key={level.level}
          onClick={() => onSelect(level.level)}
        >
          <span className="choice__icon">
            <Icon name="agents" size={18} />
          </span>
          <span className="choice__name">{level.label}</span>
          <span className="choice__tagline">{level.tagline}</span>
          <span className="choice__duties">{level.duties}</span>
          <span className="choice__cta">
            <Icon name="plus" size={13} />
            Create {level.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export default AgentLevelChoice;
