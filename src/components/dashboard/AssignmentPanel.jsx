import { useEffect, useState } from 'react';

import Icon from './Icon.jsx';
import { StatusPill } from './StatusPill.jsx';
import { AGENT_LEVELS } from '../../constants/agentForm.js';
import * as applicationsApi from '../../api/applications.js';
import { getErrorMessage } from '../../api/client.js';

/* Who is working this application, and how to change it.

   Two independent slots, not one: an application carries at most one Agent 1
   (verification) and at most one Agent 2 (department follow-up) at a time, and
   the two are different jobs with different rosters. That is why choosing who
   to assign always starts by choosing which of the two slots is being
   changed — the same distinction AgentLevelChoice asks when an account is
   first created, asked here instead of a stray "for which one?" a name alone
   cannot answer.

   Assignment normally happens by itself: the engine picks an Agent 1 the
   moment a citizen submits, and picks an Agent 2 the moment Agent 1 forwards
   it. This panel is where an admin sees what it chose and, when they
   disagree or when nobody was eligible, overrules it.

   The picker is fetched rather than built from the agent roster: the API
   answers with exactly the agents this application could go to at the chosen
   level, ranked the way the engine ranks them and carrying what each is
   holding. Offering the full roster would let an admin choose somebody the
   assign call then refuses. */

const DATE_TIME = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

const stamp = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', DATE_TIME);
};

/** "4.2h" — the engine works in minutes; an admin does not read minutes. */
const hours = (minutes) =>
  typeof minutes === 'number' ? `${(minutes / 60).toFixed(1)}h` : '—';

const TYPE_TONE = { AUTO: 'blue', MANUAL: 'violet' };
const TYPE_LABEL = { AUTO: 'Automatic', MANUAL: 'Manual' };

/** `role` on AGENT_LEVELS is already `agent_1`/`agent_2` — the same strings
    the API takes and the same ones `assignments[].level` carries. */
const levelLabel = (level) => AGENT_LEVELS.find((one) => one.role === level)?.label ?? level;

export function AssignmentPanel({ application, onAssigned }) {
  const [choosing, setChoosing] = useState(false);
  // Null while the admin has opened the flow but not yet said which slot —
  // the step this panel exists to insert.
  const [level, setLevel] = useState(null);

  const [agents, setAgents] = useState([]);
  const [chosen, setChosen] = useState('');
  const [reason, setReason] = useState('');

  const [loadingAgents, setLoadingAgents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const holderOf = (forLevel) =>
    forLevel === 'agent_2' ? application.assignedAgent2 : application.assignedAgent;

  /* Only once the admin has said which slot they mean. The list is a handful
     of aggregations on the API's side, and an admin still choosing a level is
     not asking for them yet. */
  useEffect(() => {
    if (!choosing || !level) return undefined;

    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on open
    setLoadingAgents(true);
    setError(null);

    applicationsApi
      .listAssignableAgents(application.id, level)
      .then((rows) => {
        if (cancelled) return;

        setAgents(rows);
        // The engine's own first choice, pre-selected — an admin who agrees
        // with it has one button to press.
        setChosen(rows.find((one) => !one.isCurrent)?.id ?? '');
      })
      .catch((one) => {
        if (!cancelled) setError(getErrorMessage(one));
      })
      .finally(() => {
        if (!cancelled) setLoadingAgents(false);
      });

    return () => {
      cancelled = true;
    };
  }, [choosing, level, application.id]);

  const reset = () => {
    setChoosing(false);
    setLevel(null);
    setReason('');
    setError(null);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);

    try {
      const updated = await applicationsApi.assignApplication(application.id, {
        agentId: chosen,
        level,
        reason,
      });

      reset();
      onAssigned?.(updated);
    } catch (one) {
      setError(getErrorMessage(one));
    } finally {
      setSaving(false);
    }
  };

  const history = application.assignments ?? [];

  return (
    <section className="card card--spaced">
      <div className="card__head">
        <div>
          <h2 className="card__title">Assignment</h2>
          <p className="card__subtitle">
            Who is working this, and how they came to have it
          </p>
        </div>

        {!choosing && (
          <button className="btn btn--sm" type="button" onClick={() => setChoosing(true)}>
            <Icon name="edit" size={13} />
            Assign / Reassign
          </button>
        )}
      </div>

      {error && (
        <p className="notice notice--error" role="alert">
          <Icon name="alert" size={15} />
          {error}
        </p>
      )}

      {/* One block per slot — the two never share a row, so "which one is
          this" is never a question the facts themselves leave open. */}
      {AGENT_LEVELS.map(({ role, label }) => {
        const holder = holderOf(role);

        return (
          <dl className="appfacts" key={role}>
            <div className="appfact">
              <dt className="appfact__label">{label}</dt>
              <dd className="appfact__value">
                {/* Nobody until the engine finds someone eligible, which is a
                    real state and not a loading one — an application with no
                    available agent at this level waits here for an admin. */}
                {holder?.name ?? (
                  <span className="appempty">Nobody yet — waiting to be assigned</span>
                )}
              </dd>
            </div>

            {/* Agent 1's own arrival is recorded on the application itself;
                Agent 2's is only ever on a manual row in the history below —
                the engine's own automatic hand-off writes no root-level type
                for it — so there is nothing honest to show here for Agent 2. */}
            {role === 'agent_1' && (
              <div className="appfact">
                <dt className="appfact__label">How</dt>
                <dd className="appfact__value">
                  {application.assignmentType ? (
                    <StatusPill
                      label={TYPE_LABEL[application.assignmentType] ?? application.assignmentType}
                      tone={TYPE_TONE[application.assignmentType] ?? 'slate'}
                    />
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            )}

            <div className="appfact">
              <dt className="appfact__label">Assigned</dt>
              <dd className="appfact__value">
                {stamp(role === 'agent_2' ? application.assignedAgent2At : application.assignedAt)}
              </dd>
            </div>
          </dl>
        );
      })}

      {choosing && !level && (
        <div className="assign">
          <p className="appfact__label">Which slot are you changing?</p>

          <div className="choice-row">
            {AGENT_LEVELS.map((item) => {
              const holder = holderOf(item.role);

              return (
                <button
                  className="choice"
                  type="button"
                  key={item.role}
                  onClick={() => setLevel(item.role)}
                >
                  <span className="choice__icon">
                    <Icon name="agents" size={18} />
                  </span>
                  <span className="choice__name">{item.label}</span>
                  <span className="choice__tagline">{item.tagline}</span>
                  <span className="choice__duties">
                    {holder?.name ? `Currently ${holder.name}` : 'Not yet assigned'}
                  </span>
                  <span className="choice__cta">
                    <Icon name={holder ? 'edit' : 'plus'} size={13} />
                    {holder ? `Reassign ${item.label}` : `Assign ${item.label}`}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="assign__actions">
            <button className="btn btn--sm" type="button" onClick={reset}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {choosing && level && (
        <div className="assign">
          <p className="appfact__label">
            <button className="card__link" type="button" onClick={() => setLevel(null)}>
              <Icon name="chevronLeft" size={12} />
              Change slot
            </button>
            {` — assigning ${levelLabel(level)}`}
          </p>

          {loadingAgents && <p className="appempty">Finding eligible agents…</p>}

          {!loadingAgents && agents.length === 0 && (
            <p className="appempty">
              No {levelLabel(level)} in this department can take this application right now —
              every one of them is inactive, on leave, or not cleared to work.
            </p>
          )}

          {!loadingAgents && agents.length > 0 && (
            <>
              {/* Ranked as the engine ranks them, with the numbers it used, so
                  an admin overruling it can see what they are overruling. */}
              <label className="assign__field">
                <span className="appfact__label">Assign to</span>
                <select
                  className="toolbar__select"
                  value={chosen}
                  onChange={(event) => setChosen(event.target.value)}
                >
                  <option value="">Choose an agent…</option>
                  {agents.map((agent) => (
                    <option value={agent.id} key={agent.id} disabled={agent.isCurrent}>
                      {agent.fullName ?? agent.employeeId}
                      {` — ${agent.queueSize} active, ${hours(agent.avgTatMinutes)} avg`}
                      {` · score ${agent.score}`}
                      {agent.isCurrent ? ' (current)' : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="assign__field">
                <span className="appfact__label">Reason (optional)</span>
                <input
                  className="toolbar__select"
                  type="text"
                  value={reason}
                  maxLength={500}
                  placeholder="Workload balancing"
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>

              <div className="assign__actions">
                <button
                  className="btn btn--primary btn--sm"
                  type="button"
                  disabled={!chosen || saving}
                  onClick={submit}
                >
                  {saving ? 'Assigning…' : 'Assign'}
                </button>
                <button className="btn btn--sm" type="button" disabled={saving} onClick={reset}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Never overwritten, so this only grows. An application moved three
          times shows all three, oldest first. */}
      {history.length > 0 && (
        <>
          <h3 className="appsection__title">History</h3>

          <ol className="apptrail">
            {history.map((entry) => (
              <li className="apptrail__row" key={entry.id}>
                <span className="apptrail__dot" aria-hidden="true" />

                <div className="apptrail__body">
                  <p className="apptrail__title">
                    {entry.agent?.name ?? entry.agent?.employeeId ?? 'Unknown agent'}
                    {' — '}
                    {levelLabel(entry.level)}
                    {' · '}
                    {TYPE_LABEL[entry.type] ?? entry.type}
                  </p>
                  <p className="apptrail__note">
                    {entry.reason}
                    {/* What the engine was looking at when it chose. Without it
                        "why did this go to her" has no answer six weeks later,
                        because the queue it was measured against has moved on. */}
                    {entry.score !== null && entry.metrics
                      ? ` · score ${entry.score}, ${entry.metrics.queueSize} active, ${hours(
                          entry.metrics.avgTatMinutes
                        )} avg`
                      : ''}
                  </p>
                </div>

                <span className="apptrail__when">{stamp(entry.at)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

export default AssignmentPanel;
