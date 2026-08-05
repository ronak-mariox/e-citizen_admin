import { useEffect, useState } from 'react';

import Icon from '../dashboard/Icon.jsx';
import AgentForm from '../dashboard/AgentForm.jsx';
import AgentLevelChoice from '../dashboard/AgentLevelChoice.jsx';
import { StatusPill } from '../dashboard/StatusPill.jsx';
import PanelCard from './PanelCard.jsx';
import PanelSearch from './PanelSearch.jsx';
import * as agentsApi from '../../api/agents.js';
import { getErrorMessage } from '../../api/client.js';
import { AGENT_LEVEL_LABEL } from '../../constants/records.js';
import { findLevel } from '../../constants/agentForm.js';
import {
  ACCOUNT_STATUS_FILTERS,
  AGENT_LEVEL_FILTERS,
  STAFF_ROLE_TONE,
} from '../../constants/settings.js';
import { userStatus } from '../../constants/statusTone.js';
import { initialsOf } from '../../utils/format.js';

/* Agent accounts, and where they are created.

   The /agents screen is the *work* view — it leads with assigned volume,
   because rebalancing a queue is what an admin goes there to do. This is the
   *account* view: who exists, at which level, in which department, and whether
   they can sign in at all. Same records, different question, so the columns
   differ and the actions here are account actions rather than workload ones.

   Creating an agent belongs on both, and does: the roster you are looking at is
   the thing you are adding to. The two share the level picker and the form, so
   there is one flow with two doors rather than two flows. */

const levelRole = (level) => (level === 'l1' ? 'agent_1' : 'agent_2');

const LEVEL_TO_ROLE = { all: 'all', l1: 'agent_1', l2: 'agent_2' };

const SEARCH_DEBOUNCE_MS = 300;

export function AgentsPanel() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [status, setStatus] = useState('all');

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // null while browsing, 'choose' while picking a level, then 'l1' or 'l2'.
  const [creating, setCreating] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(null);

  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

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
      .listAgents({ limit: 100, search: debouncedQuery, role: LEVEL_TO_ROLE[level], status })
      .then((data) => {
        if (cancelled) return;

        setRows(data.agents);
        setTotal(data.pagination?.total ?? data.agents.length);
      })
      .catch((error) => {
        if (cancelled) return;

        setLoadError(getErrorMessage(error));
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, level, status, reloadToken]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setSaveError(null);

    try {
      const agent = await agentsApi.createAgent(payload);

      setSaved(`${agent.fullName} was created. Employee ID ${agent.employeeId}.`);
      setCreating(null);
      setQuery('');
      setLevel('all');
      setStatus('all');
      reload();
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (creating) {
    const chosen = creating === 'choose' ? null : findLevel(creating);

    return (
      <PanelCard
        title={chosen ? `Create ${chosen.label}` : 'Create an agent'}
        subtitle={
          chosen
            ? chosen.duties
            : 'The login account only — an agent completes their own profile after the first sign-in'
        }
        action={
          <button
            className="btn"
            type="button"
            disabled={saving}
            onClick={() => {
              setCreating(chosen ? 'choose' : null);
              setSaveError(null);
            }}
          >
            <Icon name="chevronLeft" size={14} />
            {chosen ? 'Change level' : 'Back to roster'}
          </button>
        }
      >
        {saveError && (
          <p className="notice notice--error" role="alert">
            <Icon name="alert" size={15} />
            {saveError}
          </p>
        )}

        {chosen ? (
          <AgentForm
            level={creating}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={() => {
              setCreating('choose');
              setSaveError(null);
            }}
          />
        ) : (
          <AgentLevelChoice onSelect={setCreating} />
        )}
      </PanelCard>
    );
  }

  return (
    <>
      {saved && (
        <p className="notice">
          <Icon name="check" size={15} />
          {saved}
        </p>
      )}

      <PanelCard
        title="Agents"
        count={total}
        subtitle="The field staff who process applications — an agent signs in with their employee ID"
        flush
        action={
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setCreating('choose')}
          >
            <Icon name="plus" size={14} />
            Add Agent
          </button>
        }
      >
        <PanelSearch
          value={query}
          onChange={setQuery}
          placeholder="Search agents by name, employee ID or department…"
        >
          <select
            className="toolbar__select"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            aria-label="Filter by level"
          >
            {AGENT_LEVEL_FILTERS.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="toolbar__select"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
          >
            {ACCOUNT_STATUS_FILTERS.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </PanelSearch>

        <div className="card__bleed">
          <div className="table__overflow">
            <div className="table table--agent-accounts" role="table">
              <div className="table__head" role="row">
                <div role="columnheader">Agent</div>
                {/* An agent has no email — models/agent.js keeps a mobile,
                    because that is where a password-reset OTP is delivered. */}
                <div role="columnheader">Mobile</div>
                <div role="columnheader">Level</div>
                <div role="columnheader">Department</div>
                <div role="columnheader">Status</div>
                <div role="columnheader">Last Active</div>
                <div role="columnheader" className="table__cell--end">
                  Actions
                </div>
              </div>

              {rows.map((agent) => {
                const tone = userStatus(agent.status);
                const level = agent.role === 'agent_1' ? 'l1' : 'l2';

                return (
                  <div className="table__row" role="row" key={agent._id}>
                    <div className="table__cell" role="cell">
                      <span className="person">
                        <span className="person__avatar" aria-hidden="true">
                          {initialsOf(agent.fullName)}
                        </span>
                        <span className="person__body">
                          <span className="person__name">{agent.fullName}</span>
                          <span className="person__meta">{agent.employeeId}</span>
                        </span>
                      </span>
                    </div>

                    <div className="table__cell table__muted table__truncate" role="cell">
                      {agent.mobile}
                    </div>

                    <div className="table__cell" role="cell">
                      <span className={`tag tag--${STAFF_ROLE_TONE[levelRole(level)]}`}>
                        {AGENT_LEVEL_LABEL[level]}
                      </span>
                    </div>

                    <div className="table__cell table__muted table__truncate" role="cell">
                      {agent.department?.name ?? '—'}
                    </div>

                    <div className="table__cell" role="cell">
                      <StatusPill label={tone.label} tone={tone.tone} />
                    </div>

                    {/* Null until the first sign-in, which for a freshly created
                        account is the normal case rather than missing data. */}
                    <div className="table__cell table__muted" role="cell">
                      {agent.lastActive
                        ? new Date(agent.lastActive).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : 'Never'}
                    </div>

                    <div className="table__cell table__cell--end" role="cell">
                      <span className="row-actions">
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`Edit ${agent.fullName}`}
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        {/* An agent cannot be deleted either — closing an account
                            records an exit date and stops new assignments. */}
                        <button
                          className="icon-button icon-button--danger"
                          type="button"
                          aria-label={`Suspend ${agent.fullName}`}
                        >
                          <Icon name="ban" size={15} />
                        </button>
                      </span>
                    </div>
                  </div>
                );
              })}

              {loading && rows.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="refresh" size={20} />
                  </span>
                  <p className="empty__title">Loading agents…</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="alert" size={20} />
                  </span>
                  <p className="empty__title">Could not load agents</p>
                  <p className="empty__text">{loadError}</p>
                  <button className="btn btn--sm" type="button" onClick={reload}>
                    <Icon name="refresh" size={13} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && rows.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="agents" size={20} />
                  </span>
                  <p className="empty__title">
                    {debouncedQuery || level !== 'all' || status !== 'all'
                      ? 'No agent matches those filters'
                      : 'No agents yet'}
                  </p>
                  <p className="empty__text">
                    {debouncedQuery || level !== 'all' || status !== 'all'
                      ? 'Clear the search or pick a different level to see the full roster.'
                      : 'Add one and they can start working applications.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PanelCard>
    </>
  );
}

export default AgentsPanel;
