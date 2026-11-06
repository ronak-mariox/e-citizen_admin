import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import BarChart from '../components/dashboard/BarChart.jsx';
import MeterList from '../components/dashboard/MeterList.jsx';
import * as reportsApi from '../api/reports.js';
import * as departmentsApi from '../api/departments.js';
import { getErrorMessage } from '../api/client.js';
import { DEFAULT_REPORT, RANGE_PRESETS, REPORT_ACCENTS, REPORT_TABS } from '../constants/reports.js';
import { rupees } from '../utils/format.js';
import '../styles/settings.css';

/* Reports — seven read-only views over the same platform records, one at a
   time behind a tab strip.

   Every report comes back in one shape (see backend report.service.js), so
   this page is a single renderer: tiles, a trend, breakdowns and a table, plus
   the report's own notes on what the platform does not record. The tab, the
   range and the department ride in the query string, so a report can be
   linked to and survives a reload. The table exports as CSV exactly as shown. */

const TODAY = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

/** YYYY-MM-DD, `days` back from today so the range is `days` long including today. */
const daysBack = (days) => {
  const at = new Date(`${TODAY()}T00:00:00+05:30`);
  at.setDate(at.getDate() - (days - 1));
  return at.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

const DATE = { day: '2-digit', month: 'short', year: 'numeric' };

/** How a value prints, by the `format` the report gave it. Money arrives in paise. */
function formatValue(value, format) {
  if (value === null || value === undefined || value === '') return '—';

  switch (format) {
    case 'money':
      return rupees(value / 100);
    case 'percent':
      return `${value}%`;
    case 'hours':
      return value >= 48 ? `${Math.round((value / 24) * 10) / 10} days` : `${value} hrs`;
    case 'date': {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', DATE);
    }
    case 'number':
      return Number(value).toLocaleString('en-IN');
    default:
      return String(value);
  }
}

/** The same value for a spreadsheet: money in rupees, no symbols or grouping. */
function csvValue(value, format) {
  if (value === null || value === undefined) return '';
  if (format === 'money') return (value / 100).toFixed(2);
  if (format === 'date') return value ? String(value).slice(0, 10) : '';

  return String(value);
}

function downloadCsv(report) {
  const { columns, rows } = report.table;
  const escape = (cell) => (/[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);
  const lines = [
    columns.map((column) => escape(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => escape(csvValue(row[column.key], column.format))).join(',')),
  ];

  // The BOM makes Excel read the rupee names and Indian text as UTF-8.
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.type}-report_${report.range.from}_to_${report.range.to}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Every nth label only, so thirty bars do not print thirty overlapping dates. */
const thinLabels = (labels) => {
  const every = Math.ceil(labels.length / 10);
  return labels.map((label, index) => (index % every === 0 ? label : ''));
};

const TILE_ICONS = ['reports', 'check', 'alert', 'clock', 'trendUp', 'shield'];

/** One share-of-total card. */
function Breakdown({ breakdown }) {
  return (
    <section className="card">
      <div className="card__head">
        <div>
          <h2 className="card__title">{breakdown.title}</h2>
        </div>
      </div>
      {breakdown.items.some((item) => item.value > 0) ? (
        <MeterList
          items={breakdown.items.map((item, index) => ({
            ...item,
            color: REPORT_ACCENTS[index % REPORT_ACCENTS.length],
          }))}
          formatValue={(value) => formatValue(value, breakdown.format)}
        />
      ) : (
        <p className="appempty">Nothing in this range.</p>
      )}
    </section>
  );
}

export function ReportsPage() {
  const [params, setParams] = useSearchParams();

  const activeTab = REPORT_TABS.find((tab) => tab.id === params.get('report')) ?? REPORT_TABS[0];
  const from = params.get('from') || daysBack(30);
  const to = params.get('to') || TODAY();
  const department = params.get('department') || 'all';

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

  /** Change some filters, keeping the rest; a default value drops out of the URL. */
  const update = (changes) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          const isDefault =
            (key === 'report' && value === DEFAULT_REPORT) || (key === 'department' && value === 'all');
          if (value === null || isDefault) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true }
    );

  useEffect(() => {
    let cancelled = false;

    departmentsApi
      .listDepartments({ limit: 100 })
      .then((data) => {
        if (!cancelled) setDepartments(data.departments ?? []);
      })
      .catch(() => {
        // The filter simply offers "All departments" alone.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with the API
    setLoading(true);
    setLoadError(null);

    reportsApi
      .getReport(activeTab.id, { from, to, department: activeTab.byDepartment ? department : undefined })
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(getErrorMessage(error));
          setReport(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab.id, activeTab.byDepartment, from, to, department, reloadToken]);

  const activePreset = RANGE_PRESETS.find((preset) => to === TODAY() && from === daysBack(preset.days))?.id;

  /* A report from a previous tab is not shown under this one's heading while
     the new one loads. */
  const shown = report?.type === activeTab.id ? report : null;

  const trendSeries = useMemo(
    () =>
      (shown?.trend?.series ?? []).map((line, index) => ({
        ...line,
        color: REPORT_ACCENTS[index % REPORT_ACCENTS.length],
      })),
    [shown]
  );

  const columnsStyle = shown
    ? {
        gridTemplateColumns: shown.table.columns
          .map((column, index) => (index === 0 ? 'minmax(160px, 1.6fr)' : 'minmax(92px, 1fr)'))
          .join(' '),
        // Columns plus the 11px gaps and the row's own padding; wider scrolls.
        minWidth: `${160 + (shown.table.columns.length - 1) * 104 + 30}px`,
      }
    : undefined;

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Reports</h1>
            <p className="page__subtitle">
              Applications, money, people and support across the platform, over any range of days
            </p>
          </div>

          <div className="page__actions">
            <button className="btn" type="button" onClick={reload} disabled={loading}>
              <Icon name="refresh" size={14} />
              Refresh
            </button>
            <button
              className="btn btn--primary"
              type="button"
              disabled={!shown || shown.table.rows.length === 0}
              onClick={() => downloadCsv(shown)}
            >
              <Icon name="download" size={14} />
              Export CSV
            </button>
          </div>
        </div>

        <nav className="settings-tabs" aria-label="Reports">
          {REPORT_TABS.map((tab) => {
            const isActive = tab.id === activeTab.id;

            return (
              <button
                className={isActive ? 'settings-tab settings-tab--active' : 'settings-tab'}
                type="button"
                key={tab.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => update({ report: tab.id })}
              >
                <Icon name={tab.icon} size={14} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section className="toolbar report-toolbar" aria-label="Report range">
          <div className="segmented" role="group" aria-label="Quick range">
            {RANGE_PRESETS.map((preset) => (
              <button
                className={
                  activePreset === preset.id ? 'segmented__button segmented__button--active' : 'segmented__button'
                }
                type="button"
                key={preset.id}
                aria-pressed={activePreset === preset.id}
                onClick={() => update({ from: daysBack(preset.days), to: TODAY() })}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <label className="report-toolbar__date">
            <span>From</span>
            <input
              className="toolbar__select"
              type="date"
              value={from}
              max={to}
              onChange={(event) => event.target.value && update({ from: event.target.value })}
            />
          </label>

          <label className="report-toolbar__date">
            <span>To</span>
            <input
              className="toolbar__select"
              type="date"
              value={to}
              min={from}
              max={TODAY()}
              onChange={(event) => event.target.value && update({ to: event.target.value })}
            />
          </label>

          <span className="toolbar__spacer" />

          {activeTab.byDepartment && (
            <select
              className="toolbar__select"
              value={department}
              onChange={(event) => update({ department: event.target.value })}
              aria-label="Filter by department"
            >
              <option value="all">All departments</option>
              {departments.map((one) => (
                <option value={one.id ?? one._id} key={one.id ?? one._id}>
                  {one.name}
                </option>
              ))}
            </select>
          )}
        </section>

        {loadError && (
          <section className="card card--spaced">
            <div className="empty">
              <span className="empty__icon">
                <Icon name="alert" size={20} />
              </span>
              <p className="empty__title">Could not load this report</p>
              <p className="empty__text">{loadError}</p>
              <button className="btn btn--sm" type="button" onClick={reload}>
                <Icon name="refresh" size={13} />
                Try again
              </button>
            </div>
          </section>
        )}

        {!shown && loading && !loadError && (
          <section className="card card--spaced">
            <div className="empty">
              <span className="empty__icon">
                <Icon name="refresh" size={20} />
              </span>
              <p className="empty__title">Building the report…</p>
            </div>
          </section>
        )}

        {shown && (
          <div className={loading ? 'report report--stale' : 'report'} aria-busy={loading}>
            {shown.notes?.length > 0 && (
              <div className="report__notes">
                {shown.notes.map((note) => (
                  <p className="report__note" key={note}>
                    <Icon name="alert" size={14} />
                    {note}
                  </p>
                ))}
              </div>
            )}

            <div className="stat-grid">
              {shown.summary.map((item, index) => (
                <StatCard
                  key={item.key}
                  icon={TILE_ICONS[index % TILE_ICONS.length]}
                  accent={REPORT_ACCENTS[index % REPORT_ACCENTS.length]}
                  value={formatValue(item.value, item.format)}
                  label={item.label}
                  hint={item.hint}
                />
              ))}
            </div>

            {/* The trend shares a row with the first breakdown; any others
                sit two to a row beneath. */}
            {shown.trend && (
              <div className="chart-row">
                <section className="card">
                  <div className="card__head">
                    <div>
                      <h2 className="card__title">{shown.trend.title}</h2>
                      <p className="card__subtitle">
                        {shown.trend.format === 'money' ? 'Amount' : 'Count'} per {shown.range.granularity},{' '}
                        {formatValue(shown.range.from, 'date')} – {formatValue(shown.range.to, 'date')}
                      </p>
                    </div>
                  </div>
                  <BarChart labels={thinLabels(shown.trend.labels)} series={trendSeries} caption={shown.trend.title} />
                </section>

                {shown.breakdowns[0] && <Breakdown breakdown={shown.breakdowns[0]} />}
              </div>
            )}

            {(shown.trend ? shown.breakdowns.slice(1) : shown.breakdowns).length > 0 && (
              <div className="split-row">
                {(shown.trend ? shown.breakdowns.slice(1) : shown.breakdowns).map((breakdown) => (
                  <Breakdown breakdown={breakdown} key={breakdown.key} />
                ))}
              </div>
            )}

            <section className="table-shell report__table" aria-label={shown.table.title}>
              <div className="card__head report__table-head">
                <div>
                  <h2 className="card__title">{shown.table.title}</h2>
                  <p className="card__subtitle">
                    {shown.table.rows.length} row{shown.table.rows.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <div className="table__overflow">
                <div className="table" role="table" style={{ minWidth: columnsStyle.minWidth }}>
                  <div className="table__head" role="row" style={{ gridTemplateColumns: columnsStyle.gridTemplateColumns }}>
                    {shown.table.columns.map((column, index) => (
                      <div
                        role="columnheader"
                        key={column.key}
                        className={
                          index > 0 && column.format !== 'text' ? 'table__cell table__cell--end' : 'table__cell'
                        }
                      >
                        {column.label}
                      </div>
                    ))}
                  </div>

                  {shown.table.rows.map((row, rowIndex) => (
                    <div
                      className="table__row"
                      role="row"
                      key={rowIndex}
                      style={{ gridTemplateColumns: columnsStyle.gridTemplateColumns }}
                    >
                      {shown.table.columns.map((column, index) => (
                        <div
                          role="cell"
                          key={column.key}
                          className={[
                            'table__cell',
                            index === 0 ? 'person__name' : 'table__muted',
                            index > 0 && column.format !== 'text' ? 'table__cell--end' : '',
                            'table__truncate',
                          ].join(' ')}
                        >
                          {formatValue(row[column.key], column.format)}
                        </div>
                      ))}
                    </div>
                  ))}

                  {shown.table.rows.length === 0 && (
                    <div className="empty">
                      <span className="empty__icon">
                        <Icon name="reports" size={20} />
                      </span>
                      <p className="empty__title">Nothing to report in this range</p>
                      <p className="empty__text">Widen the date range or pick a different department.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

export default ReportsPage;
