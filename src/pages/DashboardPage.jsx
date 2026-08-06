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
import { getErrorMessage } from '../api/client.js';
import {
  ATTENTION_ITEMS,
  DEPARTMENT_LOAD,
  STATUS_BREAKDOWN,
  STAT_CARDS,
  VOLUME_CHART,
} from '../constants/dashboard.js';

function greeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* Recent activity is the live section of this screen — it reads the audit trail
   the API actually records, while the tiles and charts above are still fixtures
   from constants/dashboard.js.

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

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.fullName?.split(' ')[0] ?? 'Administrator';

  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Refresh pulls the trail again. The tiles and charts have nothing to refetch
  // yet — they are fixtures until the dashboard API exists.
  const handleRefresh = () => setReloadToken((token) => token + 1);

  /* Fetching is this screen synchronising itself with the API, which is what an
     effect is for. `cancelled` guards against two refreshes landing out of
     order and leaving the older list on screen. */
  useEffect(() => {
    let cancelled = false;

    // The spinner has to appear when the request starts, not when it finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActivityLoading(true);
    setActivityError(null);

    auditApi
      .listAuditLogs({ page: 1, limit: ACTIVITY_LIMIT })
      .then((data) => {
        if (!cancelled) setActivity(data.logs.map(toFeedItem));
      })
      .catch((error) => {
        if (cancelled) return;

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
          {STAT_CARDS.map((card) => (
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
              {ATTENTION_ITEMS.map((item) => (
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
