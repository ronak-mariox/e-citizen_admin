/* Settings — the tab strip and the data each panel renders.

   Settings is where an admin configures the platform rather than works it, so
   every tab below maps to something the codebase already has: staff accounts
   (backend/src/models/admin.js and agent.js), the permission list
   (backend/src/constants/roles.js) and the API configuration
   (backend/src/config/env.js). Nothing here invents a concept the backend does
   not carry.

   The catalogue and the audit trail are their own sidebar sections rather than
   tabs here — they are worked daily and their tables need a full page, which a
   panel inside a card cannot give them.

   `icon` keys into components/dashboard/Icon.jsx.

   The strip is not permission-filtered. This build only admits `admin` accounts
   in the first place (constants/auth.js PANEL_ROLE), and an admin here holds the
   whole back office — there is no second, higher tier above them. The backend
   still re-checks every request, which is where a real restriction belongs. */

import { ADMIN_PERMISSIONS } from './auth.js';

export const SETTINGS_TABS = [
  {
    id: 'team',
    label: 'Team Members',
    icon: 'admins',
  },
  {
    id: 'agent-actions',
    label: 'Agent Management',
    icon: 'shield',
  },
  {
    id: 'citizens',
    label: 'Citizen Management',
    icon: 'citizens',
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    icon: 'key',
  },
  {
    id: 'system',
    label: 'System Config',
    icon: 'sliders',
  },
];

export const DEFAULT_SETTINGS_TAB = SETTINGS_TABS[0].id;

export const findTab = (id) => SETTINGS_TABS.find((tab) => tab.id === id);

/* ----------------------------------------------------------------- roles -- */

/* The four roles in backend/src/constants/roles.js. They are fixed in code, not
   rows in a table — a role decides which of the four apps a sign-in opens, so a
   fifth one would need an app to open into.

   Admin is the top of the tree. There is no tier above it: an admin account
   holds the whole back office, and `label` is what the console calls it
   everywhere — no separate "super" wording. */
export const PLATFORM_ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    tone: 'violet',
    console: 'Admin console',
    summary: 'The whole back office — accounts, catalogue, payments, settings and the audit trail.',
  },
  {
    value: 'agent_1',
    label: 'Agent 1',
    tone: 'blue',
    console: 'Agent 1 app',
    summary: 'Verification desk — document review, verification and citizen follow-up.',
  },
  {
    value: 'agent_2',
    label: 'Agent 2',
    tone: 'slate',
    console: 'Agent 2 app',
    summary: 'Department desk — manual submission, department follow-up and escalation.',
  },
  {
    value: 'citizen',
    label: 'Citizen',
    tone: 'green',
    console: 'Citizen app',
    summary: 'Applies for services, pays fees and tracks their own applications. Signs in with an OTP.',
  },
];

/** Role -> how it reads in a table cell. Keys are the stored `role` values. */
export const STAFF_ROLE_LABEL = Object.fromEntries(
  PLATFORM_ROLES.map((role) => [role.value, role.label])
);

/** Which .tag--* modifier a role chip wears. */
export const STAFF_ROLE_TONE = Object.fromEntries(
  PLATFORM_ROLES.map((role) => [role.value, role.tone])
);

export const AGENT_LEVEL_FILTERS = [
  { value: 'all', label: 'All levels' },
  { value: 'l1', label: 'Agent 1' },
  { value: 'l2', label: 'Agent 2' },
];

export const ACCOUNT_STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
];

/* The whole account lifecycle — USER_STATUS in backend/src/constants/statuses.js.
   Every one is offered when changing a status, not just the suspend/reactivate
   pair, because an account also goes back to pending during re-onboarding and to
   inactive when someone leaves. `consequence` is what the admin is actually
   deciding, which the one-word label does not say. */
export const ACCOUNT_STATUS_OPTIONS = [
  {
    value: 'active',
    label: 'Active',
    tone: 'green',
    consequence: 'Can sign in and be assigned applications.',
  },
  {
    value: 'pending',
    label: 'Pending',
    tone: 'amber',
    consequence: 'Cannot sign in yet. For an account still being onboarded.',
  },
  {
    value: 'suspended',
    label: 'Suspended',
    tone: 'orange',
    consequence: 'Signed out immediately and blocked from signing in. Reversible.',
  },
  {
    value: 'inactive',
    label: 'Inactive',
    tone: 'slate',
    consequence: 'Signed out and stood down. For someone who has left the role.',
  },
  {
    value: 'blocked',
    label: 'Blocked',
    tone: 'red',
    consequence: 'Signed out and barred. For misconduct rather than administration.',
  },
];

/* -------------------------------------------------------- operation lists -- */

/* The actions an admin performs on one person at a time. They are listed here
   rather than performed here: each one opens the row it belongs to on the list
   screen, which is where the record and its history already are. */
export const AGENT_OPERATIONS = [
  { icon: 'eye', label: 'View and search the roster', hint: 'Filter by level, department or status', to: '/agents' },
  { icon: 'agents', label: 'Edit an agent', hint: 'Profile, work scope, capacity and payout account', to: '/agents' },
  { icon: 'shield', label: 'Reset a password', hint: 'Issues a temporary password the agent must change', to: '/agents' },
  /* `action` instead of `to` — this one is done here rather than on the roster.
     It needs a person and a decision, not the whole record. */
  {
    icon: 'ban',
    label: 'Suspend or reactivate',
    hint: 'Blocks sign-in without deleting any history',
    action: 'status',
  },
  { icon: 'settlements', label: 'Close an account', hint: 'Records an exit date and stops new assignments', to: '/agents' },
];

export const CITIZEN_OPERATIONS = [
  { icon: 'eye', label: 'View and search citizens', hint: 'By mobile number, citizen ID or district', to: '/citizens' },
  { icon: 'citizens', label: 'Edit a citizen profile', hint: 'Contact details, address and document locker', to: '/citizens' },
  { icon: 'check', label: 'Verify KYC documents', hint: 'Approve or reject what a citizen uploaded', to: '/citizens' },
  { icon: 'wallet', label: 'Adjust a wallet', hint: 'Manual credit, refund or reversal', to: '/wallets' },
  { icon: 'ban', label: 'Suspend or block', hint: 'Stops new applications and OTP sign-in', to: '/citizens' },
];

/* ------------------------------------------------------------ permissions -- */

/* ADMIN_PERMISSIONS from backend/src/constants/roles.js, with what each one
   actually unlocks and the section it governs.

   These are the capabilities that make up the Admin role rather than a tier
   above it — every admin account carries the full set, and the list is here so
   the console can say what "admin" actually means instead of asking anyone to
   take the word on trust. */
export const PERMISSION_CATALOG = [
  {
    value: ADMIN_PERMISSIONS.MANAGE_ADMINS,
    label: 'Manage administrators',
    grants: 'Create, scope and suspend other admin accounts',
    section: 'Administrators',
  },
  {
    value: ADMIN_PERMISSIONS.MANAGE_AGENTS,
    label: 'Manage agents',
    grants: 'Create agents, set their work scope and reset their passwords',
    section: 'Agents',
  },
  {
    value: ADMIN_PERMISSIONS.MANAGE_CITIZENS,
    label: 'Manage citizens',
    grants: 'Edit citizen profiles, verify KYC and block sign-in',
    section: 'Citizens',
  },
  {
    value: ADMIN_PERMISSIONS.MANAGE_CATALOG,
    label: 'Manage catalogue',
    grants: 'Departments, service categories and services, including pricing',
    section: 'Departments & Services',
  },
  {
    value: ADMIN_PERMISSIONS.MANAGE_APPLICATIONS,
    label: 'Manage applications',
    grants: 'Reassign, escalate and force-close citizen applications',
    section: 'Applications',
  },
  {
    value: ADMIN_PERMISSIONS.MANAGE_PAYMENTS,
    label: 'Manage payments',
    grants: 'Wallet recharges, refunds and manual credits',
    section: 'Wallets & Recharges',
  },
  {
    value: ADMIN_PERMISSIONS.MANAGE_SETTLEMENTS,
    label: 'Manage settlements',
    grants: 'Approve and release agent payouts',
    section: 'Settlements',
  },
  {
    value: ADMIN_PERMISSIONS.MANAGE_TICKETS,
    label: 'Manage tickets',
    grants: 'Answer, reassign and close support tickets',
    section: 'Support Tickets',
  },
  {
    value: ADMIN_PERMISSIONS.VIEW_REPORTS,
    label: 'View reports',
    grants: 'Read-only access to volume, revenue and performance reports',
    section: 'Reports',
  },
  {
    value: ADMIN_PERMISSIONS.MANAGE_SETTINGS,
    label: 'Manage settings',
    grants: 'This console, plus the audit trail',
    section: 'Settings & Audit Log',
  },
];

/* --------------------------------------------------------- system config -- */

/* Mirrors backend/src/config/env.js. Every value here is set in the API's
   environment and read at boot, so the panel shows them and names the variable
   rather than pretending they are editable from a browser. */
export const SYSTEM_CONFIG_GROUPS = [
  {
    id: 'sessions',
    title: 'Sessions & tokens',
    hint: 'A session is a short access token plus a rotating refresh cookie.',
    rows: [
      { label: 'Access token lifetime', value: '15 minutes', source: 'JWT_ACCESS_TTL' },
      { label: 'Refresh token lifetime', value: '30 days', source: 'JWT_REFRESH_TTL' },
      { label: 'Password-reset token lifetime', value: '10 minutes', source: 'JWT_RESET_TTL' },
      { label: 'Refresh cookie', value: 'httpOnly · rotated on every refresh', source: 'REFRESH_COOKIE_NAME' },
    ],
  },
  {
    id: 'otp',
    title: 'One-time passwords',
    hint: 'Citizen sign-in and staff password reset. Codes live in Redis, never in Mongo.',
    rows: [
      { label: 'Code length', value: '6 digits', source: 'env.otp.length' },
      { label: 'Validity', value: '10 minutes', source: 'OTP_TTL_MINUTES' },
      { label: 'Maximum attempts', value: '5 per code', source: 'OTP_MAX_ATTEMPTS' },
      { label: 'Resend cooldown', value: '30 seconds', source: 'OTP_RESEND_COOLDOWN_SECONDS' },
    ],
  },
  {
    id: 'platform',
    title: 'Platform',
    hint: 'Where this console is talking to, and what is behind it.',
    rows: [
      { label: 'API prefix', value: '/api/v1', source: 'API_PREFIX' },
      { label: 'Database', value: 'MongoDB · e-citizen', source: 'MONGODB_URI' },
      { label: 'OTP store', value: 'Redis · key prefix ecitizen:', source: 'REDIS_URL' },
      { label: 'Allowed origins', value: 'The five panel dev servers', source: 'CORS_ORIGINS' },
    ],
  },
];

