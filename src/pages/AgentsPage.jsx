import { useEffect, useState } from 'react';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import ListToolbar from '../components/dashboard/ListToolbar.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import AgentForm from '../components/dashboard/AgentForm.jsx';
import AgentLevelChoice from '../components/dashboard/AgentLevelChoice.jsx';
import { StatusPill } from '../components/dashboard/StatusPill.jsx';
import * as agentsApi from '../api/agents.js';
import { getErrorMessage } from '../api/client.js';
import { AGENT_LEVEL_LABEL } from '../constants/records.js';
import { findLevel } from '../constants/agentForm.js';
import { userStatus } from '../constants/statusTone.js';
import { initialsOf } from '../utils/format.js';

/* The agent roster, and where agents are created.

   Reads from the API. Search is debounced — each keystroke would otherwise be a
   round trip, and the answer to "rav" is thrown away the moment "ravi" is
   typed. */

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'inactive', label: 'Inactive' },
];

const LEVEL_TO_ROLE = { all: 'all', l1: 'agent_1', l2: 'agent_2' };

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

export function AgentsPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [level, setLevel] = useState('all');
  const [page, setPage] = useState(1);

  const [agents, setAgents] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  /* The create flow, in three states: null while browsing the roster, 'choose'
     while picking a level, then 'l1' or 'l2' once the form is open. One value
     rather than a boolean plus a level, so "creating, but no level yet" cannot
     be represented twice and drift apart. */
  const [creating, setCreating] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(null);

  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

  // A new search or filter is a new result set, so back to page one — staying
  // on page 3 of a list that now has one page shows nothing.
  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
  };

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  const changeLevel = (value) => {
    setLevel(value);
    setPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  /* Fetching is this screen synchronising itself with an external system — the
     API — which is what an effect is for. `cancelled` guards against a slower
     earlier request landing after a newer one and showing results for a search
     the user has already moved on from. */
  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setLoading(true);
    setLoadError(null);

    agentsApi
      .listAgents({
        page,
        limit: PAGE_SIZE,
        search: debouncedQuery,
        role: LEVEL_TO_ROLE[level],
        status,
      })
      .then((data) => {
        if (cancelled) return;

        setAgents(data.agents);
        setStatusCounts(data.statusCounts ?? {});
        setPagination(data.pagination);
      })
      .catch((error) => {
        if (cancelled) return;

        setLoadError(getErrorMessage(error));
        setAgents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery, level, status, reloadToken]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setSaveError(null);

    try {
      const agent = await agentsApi.createAgent(payload);

      // The issued employee ID is the one thing the admin could not have known
      // in advance, and the agent needs it to sign in — so it leads the notice.
      setSaved(`${agent.fullName} was created. Employee ID ${agent.employeeId}.`);
      setCreating(null);

      // Back to the top of an unfiltered list, so the new row is on screen
      // rather than behind whatever filter happened to be set. `reload` covers
      // the case where those were already at their defaults.
      setQuery('');
      setStatus('all');
      setLevel('all');
      setPage(1);
      reload();
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  /* Creating takes over the page rather than opening a dialog: the form is
     three sections long, and a modal that tall is a scroll trap on a laptop.
     The roster is one Back away and nothing about it is lost. */
  if (creating) {
    const chosen = creating === 'choose' ? null : findLevel(creating);

    return (
      <DashboardLayout>
        <main className="page">
          <div className="page__head">
            <div>
              <h1 className="page__title">
                {chosen ? `Create ${chosen.label}` : 'Create an agent'}
              </h1>
              <p className="page__subtitle">
                {chosen
                  ? chosen.duties
                  : 'The login account only — an agent completes their own profile after the first sign-in'}
              </p>
            </div>

            <div className="page__actions">
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
            </div>
          </div>

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
            <section className="card card--spaced">
              <div className="card__head">
                <div>
                  <h2 className="card__title">Pick a level</h2>
                  <p className="card__subtitle">
                    It decides which applications can be routed to this agent, and which onboarding
                    documents are expected.
                  </p>
                </div>
              </div>

              <AgentLevelChoice onSelect={setCreating} />
            </section>
          )}
        </main>
      </DashboardLayout>
    );
  }

  const total = pagination?.total ?? agents.length;

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Agents</h1>
            <p className="page__subtitle">
              Provision, scope and suspend the staff who process citizen applications
            </p>
          </div>

          <div className="page__actions">
            <button className="btn" type="button">
              <Icon name="download" size={14} />
              Export
            </button>
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => setCreating('choose')}
            >
              <Icon name="plus" size={14} />
              Add Agent
            </button>
          </div>
        </div>

        {saved && (
          <p className="notice">
            <Icon name="check" size={15} />
            {saved}
          </p>
        )}

        <ListToolbar
          value={query}
          onChange={changeQuery}
          placeholder="Search by name, employee ID or mobile…"
        >
          <select
            className="toolbar__select"
            value={level}
            onChange={(event) => changeLevel(event.target.value)}
            aria-label="Filter by level"
          >
            <option value="all">All levels</option>
            <option value="l1">Agent 1</option>
            <option value="l2">Agent 2</option>
          </select>

          <span className="toolbar__spacer" />

          <div className="segmented" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((filter) => (
              <button
                className={
                  status === filter.key
                    ? 'segmented__button segmented__button--active'
                    : 'segmented__button'
                }
                type="button"
                key={filter.key}
                aria-pressed={status === filter.key}
                onClick={() => changeStatus(filter.key)}
              >
                {filter.label}
                <span className="segmented__count">{statusCounts[filter.key] ?? 0}</span>
              </button>
            ))}
          </div>
        </ListToolbar>

        <section className="table-shell" aria-label="Agents">
          <div className="table__overflow">
            <div className="table table--agents" role="table">
              <div className="table__head" role="row">
                <div role="columnheader">Agent</div>
                <div role="columnheader">Level</div>
                <div role="columnheader">Department</div>
                <div role="columnheader">Mobile</div>
                <div role="columnheader">Status</div>
                <div role="columnheader">Created</div>
                <div role="columnheader" className="table__cell--end">
                  Actions
                </div>
              </div>

              {agents.map((agent) => {
                const tone = userStatus(agent.status);

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

                    <div className="table__cell" role="cell">
                      <span className="tag tag--violet">
                        {AGENT_LEVEL_LABEL[agent.role === 'agent_1' ? 'l1' : 'l2']}
                      </span>
                    </div>

                    <div className="table__cell table__muted table__truncate" role="cell">
                      {agent.department?.name ?? '—'}
                    </div>

                    <div className="table__cell table__muted" role="cell">
                      {agent.mobile}
                    </div>

                    <div className="table__cell" role="cell">
                      <StatusPill label={tone.label} tone={tone.tone} />
                    </div>

                    <div className="table__cell table__muted" role="cell">
                      {new Date(agent.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>

                    <div className="table__cell table__cell--end" role="cell">
                      <span className="row-actions">
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`View ${agent.fullName}`}
                        >
                          <Icon name="eye" size={15} />
                        </button>
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

              {/* Three different empty tables — still loading, the request
                  failed, and genuinely nothing to show — say three different
                  things, because the fix for each is different. */}
              {loading && agents.length === 0 && (
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

              {!loading && !loadError && agents.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="agents" size={20} />
                  </span>
                  <p className="empty__title">
                    {debouncedQuery || status !== 'all' || level !== 'all'
                      ? 'No agent matches those filters'
                      : 'No agents yet'}
                  </p>
                  <p className="empty__text">
                    {debouncedQuery || status !== 'all' || level !== 'all'
                      ? 'Clear the search or pick a different status to see the full roster.'
                      : 'Add one and they can start working applications.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <TableFooter
            shown={agents.length}
            total={total}
            noun="agents"
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </section>
      </main>
    </DashboardLayout>
  );
}

export default AgentsPage;
