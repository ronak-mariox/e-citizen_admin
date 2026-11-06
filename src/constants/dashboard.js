/* Dashboard content and sample data.

   Most figures below are placeholder data standing in for a chart API that
   does not exist yet — the components read shape, not values, so swapping in
   a fetched payload is a matter of matching these keys. Every STAT_CARDS
   entry is now overridden with a live figure by DashboardPage.jsx — see its
   LIVE_STAT_IDS note; the values here only show until that lands.

   `accent` is a hex rather than a token because the stat tiles are a deliberate
   sequence of hues; see components/dashboard/StatCard.jsx. */

export const STAT_CARDS = [
  {
    id: 'applications-today',
    icon: 'applications',
    accent: '#0052cc',
    value: '248',
    label: 'Applications Today',
    hint: 'Across 14 departments',
    trend: { direction: 'up', value: '12%' },
    to: '/applications',
  },
  {
    id: 'pending-review',
    icon: 'clock',
    accent: '#fe9a00',
    value: '86',
    label: 'Awaiting Verification',
    hint: 'Queued with agents',
    trend: { direction: 'down', value: '4%' },
    to: '/applications',
  },
  {
    id: 'sla-breach',
    icon: 'alert',
    accent: '#fb2c36',
    value: '9',
    label: 'SLA Breached',
    hint: 'Escalate today',
    hintTone: 'danger',
    to: '/applications',
  },
  {
    id: 'active-agents',
    icon: 'agents',
    accent: '#00bba7',
    value: '42 / 47',
    label: 'Agents Online',
    hint: '5 inactive this week',
    to: '/agents',
  },
  {
    id: 'citizens',
    icon: 'citizens',
    accent: '#615fff',
    value: '18,402',
    label: 'Registered Citizens',
    trend: { direction: 'up', value: '3%' },
    to: '/citizens',
  },
  /* The company wallet every citizen payment lands in, and the payouts still
     owed to Agent 2 from it — both live, from `stats.walletBalance` and
     `stats.payoutsDue`. */
  {
    id: 'recharges',
    icon: 'wallet',
    accent: '#8e51ff',
    value: '0',
    label: 'Company Wallet',
    hint: 'Balance held',
    to: '/wallets',
  },
  {
    id: 'settlements',
    icon: 'settlements',
    accent: '#00a63e',
    value: '0',
    label: 'Payouts Due',
    hint: 'Owed to Agent 2',
    to: '/settlements',
  },
  {
    id: 'tickets',
    icon: 'tickets',
    accent: '#ff6900',
    value: '0',
    label: 'Open Tickets',
    hint: 'Raised by citizens',
    to: '/tickets',
  },
];

export const VOLUME_CHART = {
  labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  series: [
    { key: 'received', label: 'Received', color: '#0052cc', values: [520, 610, 580, 720, 810, 690] },
    { key: 'completed', label: 'Completed', color: '#00a63e', values: [470, 560, 520, 660, 730, 610] },
    { key: 'rejected', label: 'Rejected', color: '#fb2c36', values: [30, 44, 38, 51, 62, 47] },
  ],
};

/** Shares of the live application pipeline, largest first. */
export const STATUS_BREAKDOWN = [
  { key: 'under_verification', label: 'Under Verification', value: 86, color: '#615fff' },
  { key: 'submitted_to_department', label: 'With Department', value: 64, color: '#0052cc' },
  { key: 'query_raised', label: 'Query Raised', value: 41, color: '#fe9a00' },
  { key: 'pending_payment', label: 'Pending Payment', value: 28, color: '#ff6900' },
  { key: 'escalated', label: 'Escalated', value: 9, color: '#fb2c36' },
];

/** Busiest departments — where an admin would rebalance agent capacity. */
export const DEPARTMENT_LOAD = [
  { key: 'revenue', label: 'Revenue', value: 412, color: '#0052cc' },
  { key: 'urban-dev', label: 'Urban Development', value: 318, color: '#615fff' },
  { key: 'registration', label: 'Registration', value: 264, color: '#00bba7' },
  { key: 'transport', label: 'Transport', value: 187, color: '#8e51ff' },
  { key: 'social-welfare', label: 'Social Welfare', value: 121, color: '#fe9a00' },
];

/* The dashboard's Recent Activity fixture lived here. It now reads the audit
   trail through /audit-logs — see DashboardPage — so there is nothing to keep
   in step with it. */

/* "Needs Your Attention" used to be a fixture here — 31 wallet recharges, 3
   support tickets, 2 agent accounts "pending activation": none of that is
   real, the same wallets/tickets gap STAT_CARDS has above, plus an agent
   activation concept nothing in the backend tracks either. The one entry that
   *was* real — applications past their SLA — duplicated the live
   `stats.slaBreached` figure with a hand-written number that could not stay
   in step with it.

   DashboardPage.jsx now builds this list itself from `stats`, so an entry
   only ever appears when there is a genuine count behind it, and disappears
   the moment that count is zero rather than sitting there stale at "0
   wallet recharges awaiting approval". */
