/* Dashboard content and sample data.

   Every figure below is placeholder data standing in for the API — the
   components read shape, not values, so swapping in a fetched payload is a
   matter of matching these keys.

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
  {
    id: 'recharges',
    icon: 'wallet',
    accent: '#8e51ff',
    value: '31',
    label: 'Recharges to Approve',
    hint: '₹2.4L pending',
    to: '/wallets',
  },
  {
    id: 'settlements',
    icon: 'settlements',
    accent: '#00a63e',
    value: '₹6.8L',
    label: 'Settlements Due',
    hint: 'Next cycle: 05 Aug',
    to: '/settlements',
  },
  {
    id: 'tickets',
    icon: 'tickets',
    accent: '#ff6900',
    value: '17',
    label: 'Open Tickets',
    hint: '3 breaching SLA',
    hintTone: 'danger',
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

/** Things an admin should clear today, surfaced so they are not hunted for. */
export const ATTENTION_ITEMS = [
  {
    id: 'at-1',
    icon: 'wallet',
    accent: '#8e51ff',
    title: '31 wallet recharges awaiting approval',
    meta: '₹2,41,500 total · oldest waiting 2 days',
    to: '/wallets',
  },
  {
    id: 'at-2',
    icon: 'alert',
    accent: '#fb2c36',
    title: '9 applications past their SLA',
    meta: 'Urban Development and Revenue',
    to: '/applications',
  },
  {
    id: 'at-3',
    icon: 'tickets',
    accent: '#ff6900',
    title: '3 support tickets breaching first response',
    meta: 'Category: payment and dispute',
    to: '/tickets',
  },
  {
    id: 'at-4',
    icon: 'agents',
    accent: '#fe9a00',
    title: '2 agent accounts pending activation',
    meta: 'Created last week, never signed in',
    to: '/agents',
  },
];
