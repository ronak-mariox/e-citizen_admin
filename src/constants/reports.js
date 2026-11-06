/**
 * The Reports section's tabs — keys match backend report.service.js REPORTS.
 *
 * `byDepartment` says whether the department filter means anything for that
 * report; the others are platform-wide by nature (accounts, tickets, payouts).
 */
export const REPORT_TABS = [
  { id: 'applications', label: 'Applications', icon: 'applications', byDepartment: true },
  { id: 'wallet', label: 'Wallet', icon: 'wallet', byDepartment: true },
  { id: 'settlements', label: 'Settlements', icon: 'settlements', byDepartment: false },
  { id: 'users', label: 'Users', icon: 'citizens', byDepartment: false },
  { id: 'services', label: 'Services', icon: 'services', byDepartment: true },
  { id: 'agents', label: 'Agent Performance', icon: 'agents', byDepartment: true },
  { id: 'support', label: 'Support', icon: 'tickets', byDepartment: false },
];

export const DEFAULT_REPORT = REPORT_TABS[0].id;

/** Quick ranges, in days back from today (inclusive of today). */
export const RANGE_PRESETS = [
  { id: '7', label: '7 days', days: 7 },
  { id: '30', label: '30 days', days: 30 },
  { id: '90', label: '90 days', days: 90 },
  { id: '365', label: '12 months', days: 365 },
];

/** The tiles and series colours, in order — the dashboard's own sequence of hues. */
export const REPORT_ACCENTS = ['#0052cc', '#00a63e', '#fb2c36', '#fe9a00', '#615fff', '#00bba7', '#8e51ff', '#ff6900'];
