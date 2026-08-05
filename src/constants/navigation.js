/**
 * The admin sidebar.
 *
 * An agent panel has a flat nav because an agent has one job — work a queue.
 * An admin has ten, so the rail is grouped: without the headings the list reads
 * as an undifferentiated wall of twelve links and nothing tells you that
 * Recharges and Settlements are the same kind of work while Departments is not.
 *
 * Every entry is shown to every admin. This build only admits `admin` accounts
 * (constants/auth.js PANEL_ROLE) and an admin holds the whole back office —
 * there is no lesser admin to hide a section from. Restricting a section is the
 * backend's job, and it re-checks every request.
 *
 * `icon` keys into components/dashboard/Icon.jsx.
 */
export const NAV_GROUPS = [
  {
    id: 'overview',
    items: [{ label: 'Dashboard', icon: 'dashboard', to: '/dashboard' }],
  },
  {
    id: 'people',
    title: 'People',
    items: [
      { label: 'Agents', icon: 'agents', to: '/agents' },
      { label: 'Citizens', icon: 'citizens', to: '/citizens' },
      { label: 'Administrators', icon: 'admins', to: '/administrators' },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    items: [
      { label: 'Applications', icon: 'applications', to: '/applications' },
      { label: 'Support Tickets', icon: 'tickets', to: '/tickets' },
    ],
  },
  {
    id: 'catalog',
    title: 'Catalog',
    items: [
      { label: 'Departments', icon: 'departments', to: '/departments' },
      { label: 'Services', icon: 'services', to: '/services' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    items: [
      { label: 'Wallets & Recharges', icon: 'wallet', to: '/wallets' },
      { label: 'Settlements', icon: 'settlements', to: '/settlements' },
    ],
  },
  {
    id: 'system',
    title: 'System',
    items: [
      { label: 'Reports', icon: 'reports', to: '/reports' },
      { label: 'Audit Log', icon: 'audit', to: '/audit-log' },
      { label: 'Settings', icon: 'settings', to: '/settings' },
    ],
  },
];

/** Flat list, for route generation and for resolving a path back to its label. */
export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export default NAV_GROUPS;
