import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import BarChart from '../components/dashboard/BarChart.jsx';
import MeterList from '../components/dashboard/MeterList.jsx';
import ActivityFeed from '../components/dashboard/ActivityFeed.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ATTENTION_ITEMS,
  DEPARTMENT_LOAD,
  RECENT_ACTIVITY,
  STATUS_BREAKDOWN,
  STAT_CARDS,
  VOLUME_CHART,
} from '../constants/dashboard.js';

function greeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.fullName?.split(' ')[0] ?? 'Administrator';

  // TODO: refetch the dashboard payload once the admin API is available.
  function handleRefresh() {
    console.info('dashboard refresh requested');
  }

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
          <ActivityFeed items={RECENT_ACTIVITY} />
        </section>
      </main>
    </DashboardLayout>
  );
}

export default DashboardPage;
