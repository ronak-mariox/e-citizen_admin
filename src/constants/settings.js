/* Settings — the tab strip and the data each panel renders.

   Settings is where an admin configures the platform rather than works it, so
   every tab below maps to something the codebase already has: the permission
   list (backend/src/constants/roles.js) and the saved third-party integration
   credentials (backend/src/services/integrationConfig.service.js). Nothing
   here invents a concept the backend does not carry.

   Administrator accounts themselves are not managed in the console at all —
   the "Team Members" tab that used to list them was removed, and so was the
   sidebar's placeholder Administrators section. Admins are seeded with
   backend/src/scripts/seed_admin.js.

   The catalogue and the audit trail are their own sidebar sections rather than
   tabs here — they are worked daily and their tables need a full page, which a
   panel inside a card cannot give them.

   `icon` keys into components/dashboard/Icon.jsx.

   The strip is not permission-filtered. This build only admits `admin` accounts
   in the first place (constants/auth.js PANEL_ROLE), and an admin here holds the
   whole back office — there is no second, higher tier above them. The backend
   still re-checks every request, which is where a real restriction belongs. */

export const SETTINGS_TABS = [
  {
    id: 'roles',
    label: 'Roles & Permissions',
    icon: 'key',
  },
  {
    id: 'system',
    label: 'Third Party Integrations',
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
  { value: 'inactive', label: 'Inactive' },
];

/* USER_STATUS in backend/src/constants/statuses.js — two states, because an
   account either works or it does not. Why it does not is the reason stored
   with the change. `consequence` is what the admin is actually deciding, which
   the one-word label does not say. */
export const ACCOUNT_STATUS_OPTIONS = [
  {
    value: 'active',
    label: 'Active',
    tone: 'green',
    consequence: 'Can sign in and be assigned applications.',
  },
  {
    value: 'inactive',
    label: 'Inactive',
    tone: 'slate',
    consequence: 'Signed out immediately and refused at sign-in. Reversible.',
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

/* What each role may do now lives on the backend (backend/src/constants/
   permissions.js's ROLE_PERMISSION_CATALOG, read through GET
   /admins/role-permissions) rather than as a second, frontend-only copy —
   RolesPanel renders whatever that endpoint sends, so a permission is never
   described two different ways in two different places. */
