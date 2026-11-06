import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import BarChart from '../components/dashboard/BarChart.jsx';
import MeterList from '../components/dashboard/MeterList.jsx';
import ActivityFeed from '../components/dashboard/ActivityFeed.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as auditApi from '../api/audit.js';
import * as adminDashboardApi from '../api/adminDashboard.js';
import { getErrorMessage } from '../api/client.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';
import { displayName, rupees } from '../utils/format.js';
import { DEPARTMENT_LOAD, STATUS_BREAKDOWN, STAT_CARDS, VOLUME_CHART } from '../constants/dashboard.js';

function greeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* Recent activity is the live section below the tiles — it reads the audit
   trail the API actually records. "Needs Your Attention" is built from the
   same live `stats` the tiles use (see attentionItemsFrom below). The two
   charts further down are still fixtures from constants/dashboard.js.

   Six rows: enough to see what has been happening without turning the dashboard
   into a second copy of /audit-log, which is one click away and pages properly. */
const ACTIVITY_LIMIT = 6;

/** Which icon a row gets — the area the entry was recorded under. */
const AREA_ICON = {
  Agents: 'agents',
  Admins: 'admins',
  Departments: 'departments',
  Services: 'services',
  Applications: 'applications',
  Settings: 'settings',
};

/** ...and its colour, from how serious the change was. Same severities the
    audit log colours its rows by. */
const SEVERITY_ACCENT = {
  success: '#00a63e',
  info: '#0052cc',
  warning: '#e17100',
  critical: '#fb2c36',
};

/* "4m ago" rather than a timestamp. A feed is read for what just happened; the
   audit log prints the absolute time for when it has to be lined up against
   another record. */
function since(value) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

/* Audit summaries are written as sentences — "Created an Agent 1 account" — and
   the feed puts them straight after the actor's name, so the first letter is
   lowered to read as one line. Left alone when the opening word is an acronym
   or an ID, where lowercasing would be wrong. */
const asPhrase = (summary = '') =>
  /^[A-Z][a-z]/.test(summary) ? `${summary[0].toLowerCase()}${summary.slice(1)}` : summary;

/** One audit row, in the shape ActivityFeed renders. */
const toFeedItem = (entry) => ({
  id: entry._id,
  icon: AREA_ICON[entry.area] ?? 'audit',
  accent: SEVERITY_ACCENT[entry.severity] ?? SEVERITY_ACCENT.info,
  actor: entry.actorName ?? 'Someone',
  action: asPhrase(entry.summary),
  // The record it happened to, falling back to the area — a row with neither
  // would leave the second line blank and look like a rendering fault.
  target: entry.entityLabel ?? entry.area,
  time: since(entry.createdAt),
});

/* The live figure behind each STAT_CARDS tile. */
function statOverrides(stats) {
  const inactiveAgents = Math.max(stats.agentsTotal - stats.agentsOnline, 0);

  return {
    'applications-today': {
      value: String(stats.applicationsToday),
      hint: `Across ${stats.activeDepartments} active department${stats.activeDepartments === 1 ? '' : 's'}`,
    },
    'pending-review': { value: String(stats.awaitingVerification) },
    'sla-breach': { value: String(stats.slaBreached) },
    'active-agents': {
      value: `${stats.agentsOnline} / ${stats.agentsTotal}`,
      hint: `${inactiveAgents} inactive`,
    },
    citizens: { value: stats.registeredCitizens.toLocaleString('en-IN') },
    tickets: {
      value: String(stats.openTickets ?? 0),
      hint: `${stats.unassignedTickets ?? 0} unassigned`,
    },
    recharges: {
      value: rupees((stats.walletBalance ?? 0) / 100),
      hint: 'Balance held',
    },
    settlements: {
      value: String(stats.payoutsDue ?? 0),
      hint: `${rupees((stats.payoutsDueAmount ?? 0) / 100)} owed to Agent 2`,
    },
  };
}

const LIVE_STAT_IDS = [
  'applications-today',
  'pending-review',
  'sla-breach',
  'active-agents',
  'citizens',
  'tickets',
  'recharges',
  'settlements',
];

/**
 * "Needs Your Attention", built from the same `stats` the tiles above use —
 * never a fixture. `stats.slaBreached` is the only figure here with a real
 * backend behind it (wallet recharges, tickets and agent activation have
 * none — see constants/dashboard.js's own note), so this is the only entry
 * that can ever appear, and only while the count is actually above zero.
 */
function attentionItemsFrom(stats) {
  if (!stats) return [];

  const items = [];

  if (stats.slaBreached) {
    items.push({
      id: 'sla-breach',
      icon: 'alert',
      accent: '#fb2c36',
      title: `${stats.slaBreached} application${stats.slaBreached === 1 ? '' : 's'} past their SLA`,
      meta: 'Review and reassign before they slip further',
      to: '/applications',
    });
  }

  if (stats.unassignedTickets) {
    items.push({
      id: 'unassigned-tickets',
      icon: 'tickets',
      accent: '#ff6900',
      title: `${stats.unassignedTickets} support ticket${stats.unassignedTickets === 1 ? '' : 's'} with nobody on ${stats.unassignedTickets === 1 ? 'it' : 'them'}`,
      meta: 'Pick them up or assign them to an admin',
      to: '/tickets',
    });
  }

  return items;
}

/** STAT_CARDS with the live figures dropped in where this system has them.
    Still loading or the request failed: those five tiles show a dash rather
    than the fixture's number, which would read as a real — and possibly very
    wrong — figure. None of the live tiles have a real trend to compare
    against yet either, so the fixture's up/down chip is always dropped. */
function withLiveStats(stats, statsError) {
  const overrides = stats ? statOverrides(stats) : {};
  const placeholderHint = statsError ? 'Could not load' : 'Loading…';

  return STAT_CARDS.map((card) => {
    if (!LIVE_STAT_IDS.includes(card.id)) return card;

    const { trend: _trend, hint, ...rest } = card;
    /* "Loading…" only until the figures land — a tile whose override sets no
       hint of its own goes back to the card's, rather than saying Loading
       forever beside a real number. */
    return { ...rest, value: '—', hint: stats ? hint : placeholderHint, ...overrides[card.id] };
  });
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // A greeting is on first-name terms, so it takes the first word of whatever
  // the rest of the shell is calling them.
  const firstName = displayName(user).split(' ')[0];

  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [reloadToken, setReloadToken] = useState({ count: 0, quiet: false });

  // Refresh pulls the trail and the tiles again. The charts below them are
  // still fixtures until they get their own API.
  const handleRefresh = () => setReloadToken((token) => ({ count: token.count + 1, quiet: false }));

  /* Any change elsewhere refetches quietly: the tiles and feed keep what they
     show until the new figures land, and a failed refetch keeps them. */
  useLiveRefresh(() => setReloadToken((token) => ({ count: token.count + 1, quiet: true })));

  /* The stat tiles' own fetch, independent of the activity feed below — one
     failing should not take the other down with it. */
  useEffect(() => {
    let cancelled = false;
    const { quiet } = reloadToken;

    if (!quiet) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStats(null);
      setStatsError(null);
    }

    adminDashboardApi
      .getDashboardStats()
      .then((data) => {
        if (cancelled) return;
        setStats(data);
        setStatsError(null);
      })
      .catch((error) => {
        if (!cancelled && !quiet) setStatsError(getErrorMessage(error));
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  /* Fetching is this screen synchronising itself with the API, which is what an
     effect is for. `cancelled` guards against two refreshes landing out of
     order and leaving the older list on screen. */
  useEffect(() => {
    let cancelled = false;
    const { quiet } = reloadToken;

    if (!quiet) {
      // The spinner has to appear when the request starts, not when it finishes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivityLoading(true);
      setActivityError(null);
    }

    auditApi
      .listAuditLogs({ page: 1, limit: ACTIVITY_LIMIT })
      .then((data) => {
        if (cancelled) return;
        setActivity(data.logs.map(toFeedItem));
        setActivityError(null);
      })
      .catch((error) => {
        if (cancelled || quiet) return;

        setActivityError(getErrorMessage(error));
        setActivity([]);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">{`${greeting()}, ${firstName}`}</h1>
            <p className="page__subtitle">
              Platform health across every department, agent and citizen
            </p>
          </div>

          <div className="page__actions">
            <button className="btn" type="button">
              <Icon name="download" size={14} />
              Export
            </button>
            <button className="btn btn--primary" type="button" onClick={handleRefresh}>
              <Icon name="refresh" size={14} />
              Refresh
            </button>
          </div>
        </div>

        {/* Each tile is a way in, not just a number — the figure an admin cares
            about is always the one they are about to go act on. */}
        <div className="stat-grid">
          {withLiveStats(stats, statsError).map((card) => (
            <StatCard key={card.id} {...card} onClick={() => navigate(card.to)} />
          ))}
        </div>

        <div className="chart-row">
          <section className="card">
            <div className="card__head">
              <div>
                <h2 className="card__title">Application Volume</h2>
                <p className="card__subtitle">Received, completed and rejected by month</p>
              </div>
            </div>
            <BarChart labels={VOLUME_CHART.labels} series={VOLUME_CHART.series} />
          </section>

          <section className="card">
            <div className="card__head">
              <div>
                <h2 className="card__title">Live Pipeline</h2>
                <p className="card__subtitle">Where open applications are sitting</p>
              </div>
            </div>
            <MeterList items={STATUS_BREAKDOWN} />
          </section>
        </div>

        <div className="split-row">
          {/* The one screen in the console that is a to-do list rather than a
              record: an admin should not have to visit four sections to learn
              that any of them needs them. */}
          <section className="card">
            <div className="card__head">
              <div>
                <h2 className="card__title">Needs Your Attention</h2>
                <p className="card__subtitle">Queues waiting on an administrator</p>
              </div>
            </div>

            <div className="feed">
              {attentionItemsFrom(stats).map((item) => (
                <button
                  className="feed__row feed__row--link"
                  type="button"
                  key={item.id}
                  onClick={() => navigate(item.to)}
                >
                  <span
                    className="feed__icon"
                    style={{ color: item.accent, backgroundColor: `${item.accent}1f` }}
                  >
                    <Icon name={item.icon} size={15} />
                  </span>
                  <span className="feed__body">
                    <span className="feed__text">{item.title}</span>
                    <span className="feed__meta">{item.meta}</span>
                  </span>
                  <span className="feed__time">
                    <Icon name="chevronRight" size={14} />
                  </span>
                </button>
              ))}
            </div>

            {/* Loading, failed and genuinely-nothing-to-flag are three
                different situations — same three-way split as Recent
                Activity below. */}
            {!stats && !statsError && (
              <div className="empty">
                <span className="empty__icon">
                  <Icon name="refresh" size={20} />
                </span>
                <p className="empty__title">Loading…</p>
              </div>
            )}

            {statsError && (
              <div className="empty">
                <span className="empty__icon">
                  <Icon name="alert" size={20} />
                </span>
                <p className="empty__title">Could not load</p>
                <p className="empty__text">{statsError}</p>
              </div>
            )}

            {stats && !statsError && attentionItemsFrom(stats).length === 0 && (
              <div className="empty">
                <span className="empty__icon">
                  <Icon name="check" size={20} />
                </span>
                <p className="empty__title">Nothing needs your attention right now</p>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card__head">
              <div>
                <h2 className="card__title">Department Load</h2>
                <p className="card__subtitle">Open applications per department</p>
              </div>
              <button className="card__link" type="button" onClick={() => navigate('/departments')}>
                Manage
                <Icon name="chevronRight" size={12} />
              </button>
            </div>
            <MeterList items={DEPARTMENT_LOAD} />
          </section>
        </div>

        <section className="card card--spaced">
          <div className="card__head">
            <div>
              <h2 className="card__title">Recent Activity</h2>
              <p className="card__subtitle">Every privileged action is recorded</p>
            </div>
            <button className="card__link" type="button" onClick={() => navigate('/audit-log')}>
              View audit log
              <Icon name="chevronRight" size={12} />
            </button>
          </div>

          {activity.length > 0 && <ActivityFeed items={activity} />}

          {/* Still loading, the request failed, and nothing recorded yet are
              three different situations with three different fixes. */}
          {activityLoading && activity.length === 0 && (
            <div className="empty">
              <span className="empty__icon">
                <Icon name="refresh" size={20} />
              </span>
              <p className="empty__title">Loading recent activity…</p>
            </div>
          )}

          {!activityLoading && activityError && activity.length === 0 && (
            <div className="empty">
              <span className="empty__icon">
                <Icon name="alert" size={20} />
              </span>
              <p className="empty__title">Could not load recent activity</p>
              <p className="empty__text">{activityError}</p>
              <button className="btn btn--sm" type="button" onClick={handleRefresh}>
                <Icon name="refresh" size={13} />
                Try again
              </button>
            </div>
          )}

          {!activityLoading && !activityError && activity.length === 0 && (
            <div className="empty">
              <span className="empty__icon">
                <Icon name="audit" size={20} />
              </span>
              <p className="empty__title">Nothing recorded yet</p>
              <p className="empty__text">
                Privileged actions appear here as they happen — create or suspend an agent and it
                will show up.
              </p>
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}

export default DashboardPage;
