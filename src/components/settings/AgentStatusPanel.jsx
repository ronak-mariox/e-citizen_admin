import { useEffect, useState } from 'react';

import Icon from '../dashboard/Icon.jsx';
import ConfirmDialog from '../dashboard/ConfirmDialog.jsx';
import { StatusPill } from '../dashboard/StatusPill.jsx';
import PanelCard from './PanelCard.jsx';
import PanelSearch from './PanelSearch.jsx';
import * as agentsApi from '../../api/agents.js';
import { getErrorMessage } from '../../api/client.js';
import { ACCOUNT_STATUS_OPTIONS } from '../../constants/settings.js';
import { userStatus } from '../../constants/statusTone.js';
import { initialsOf } from '../../utils/format.js';

/* Suspend or reactivate an agent.

   Two steps, in the order the admin is thinking in: find the person, then
   decide what happens to them. Picking the agent first is what makes the second
   step honest — the status list can show where they are now, so "Suspended" is
   visibly a change rather than a guess.

   The confirm is separate from the choice because the consequence lands outside
   this screen: anything other than Active signs the agent out of a session they
   may be in the middle of using. */

const SEARCH_DEBOUNCE_MS = 300;

export function AgentStatusPanel({ onBack }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');

  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    // The spinner has to appear when the request starts, not when it finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError(null);

    agentsApi
      .listAgents({ limit: 50, search: debouncedQuery })
      .then((data) => {
        if (!cancelled) setAgents(data.agents);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(getErrorMessage(err));
          setAgents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, reloadToken]);

  const choose = (agent) => {
    setSelected(agent);
    // Pre-set to where they already are, so the list reads as "this is the
    // current state" and any other choice is a deliberate move away from it.
    setStatus(agent.status);
    setReason('');
    setError(null);
    setDone(null);
  };

  const apply = async () => {
    setSaving(true);
    setError(null);

    try {
      const agent = await agentsApi.updateAgentStatus(selected._id, { status, reason });
      const label = ACCOUNT_STATUS_OPTIONS.find((option) => option.value === agent.status)?.label;

      setDone(`${agent.fullName} is now ${label}.`);
      setConfirming(false);
      setSelected(null);
      setReason('');
      // Refetch so the row underneath carries the new status rather than the
      // one it was fetched with.
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  const chosenStatus = ACCOUNT_STATUS_OPTIONS.find((option) => option.value === status);
  const unchanged = selected && status === selected.status;

  return (
    <>
      {done && (
        <p className="notice">
          <Icon name="check" size={15} />
          {done}
        </p>
      )}

      {error && (
        <p className="notice notice--error" role="alert">
          <Icon name="alert" size={15} />
          {error}
        </p>
      )}

      <PanelCard
        title="Suspend or reactivate"
        subtitle="Blocks sign-in without deleting any history — pick the agent, then the status"
        action={
          <button className="btn" type="button" onClick={onBack}>
            <Icon name="chevronLeft" size={14} />
            Back
          </button>
        }
      >
        <PanelSearch
          value={query}
          onChange={setQuery}
          placeholder="Search agents by name, employee ID or mobile…"
        />

        {/* ------------------------------------------------ step 1: the agent */}
        <ul className="pick-list">
          {agents.map((agent) => {
            const tone = userStatus(agent.status);
            const isChosen = selected?._id === agent._id;

            return (
              <li key={agent._id}>
                <button
                  className={isChosen ? 'pick pick--on' : 'pick'}
                  type="button"
                  aria-pressed={isChosen}
                  onClick={() => choose(agent)}
                >
                  <span className="person__avatar" aria-hidden="true">
                    {initialsOf(agent.fullName)}
                  </span>
                  <span className="pick__body">
                    <span className="pick__name">{agent.fullName}</span>
                    <span className="pick__meta">
                      {agent.employeeId} · {agent.department?.name ?? 'No department'}
                    </span>
                  </span>
                  <StatusPill label={tone.label} tone={tone.tone} />
                </button>
              </li>
            );
          })}
        </ul>

        {loading && agents.length === 0 && <p className="pick-list__note">Loading agents…</p>}

        {!loading && loadError && (
          <p className="pick-list__note pick-list__note--error">{loadError}</p>
        )}

        {!loading && !loadError && agents.length === 0 && (
          <p className="pick-list__note">
            {debouncedQuery ? 'No agent matches that search.' : 'There are no agents yet.'}
          </p>
        )}

        {/* ----------------------------------------------- step 2: the status */}
        {selected && (
          <div className="status-form">
            <h3 className="status-form__title">
              Set status for {selected.fullName}
              <span className="status-form__id">{selected.employeeId}</span>
            </h3>

            <div className="status-options" role="radiogroup" aria-label="Account status">
              {ACCOUNT_STATUS_OPTIONS.map((option) => {
                const isCurrent = option.value === selected.status;

                return (
                  <label
                    className={status === option.value ? 'status-option status-option--on' : 'status-option'}
                    key={option.value}
                  >
                    <input
                      type="radio"
                      name="agent-status"
                      value={option.value}
                      checked={status === option.value}
                      onChange={() => setStatus(option.value)}
                    />
                    <span className="status-option__body">
                      <span className="status-option__head">
                        <span className={`tag tag--${option.tone}`}>{option.label}</span>
                        {isCurrent && <span className="status-option__current">Current</span>}
                      </span>
                      <span className="status-option__hint">{option.consequence}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            <label className="field2">
              <span className="field2__label">Reason</span>
              <textarea
                className="field2__input field2__input--area"
                value={reason}
                maxLength={500}
                rows={2}
                placeholder="Why is this changing? Stored on the account."
                onChange={(event) => setReason(event.target.value)}
              />
              <span className="field2__hint">
                Optional, but a suspension nobody can explain is one nobody can safely lift.
              </span>
            </label>

            <div className="form__actions">
              <button className="btn" type="button" onClick={() => setSelected(null)}>
                Cancel
              </button>
              <button
                className="btn btn--primary"
                type="button"
                disabled={unchanged || saving}
                onClick={() => setConfirming(true)}
              >
                <Icon name="check" size={14} />
                {unchanged ? 'No change to apply' : 'Apply changes'}
              </button>
            </div>
          </div>
        )}
      </PanelCard>

      {confirming && (
        <ConfirmDialog
          title={`Set ${selected.fullName} to ${chosenStatus?.label}?`}
          body={chosenStatus?.consequence}
          /* Named before the click, because it happens outside this screen and
             an admin should not learn about it from a support call. */
          note={
            status === 'active'
              ? undefined
              : `${selected.fullName} will be signed out immediately and will not be able to sign in again until the status is set back to Active.`
          }
          confirmLabel="Yes, apply"
          tone={status === 'active' ? 'primary' : 'danger'}
          busy={saving}
          onCancel={() => setConfirming(false)}
          onConfirm={apply}
        />
      )}
    </>
  );
}

export default AgentStatusPanel;
