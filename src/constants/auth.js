/**
 * This build is the administration console, so only `admin` accounts belong in
 * it.
 *
 * The backend issues a valid session to any staff account that signs in — one
 * /auth/login serves both agent panels and this console — so refusing the wrong
 * role is this app's job. Backend routes that are genuinely admin-only are
 * additionally gated there; this check is about which shell to let someone into.
 */
export const PANEL_ROLE = 'admin';

export const PANEL_WRONG_ROLE_MESSAGE =
  'This account is not an administrator account. Please sign in on the portal for your role.';

/**
 * Fine-grained admin capabilities, mirroring ADMIN_PERMISSIONS in
 * backend/src/constants/roles.js. Keep the two lists in step.
 *
 * These describe what the Admin role is made of rather than gate anything in
 * this console — an admin here holds all of them, so nothing client-side
 * filters on them. Settings lists them so "full access" can be read as a list
 * instead of taken on trust; enforcement is the backend's, on every request.
 */
export const ADMIN_PERMISSIONS = {
  MANAGE_ADMINS: 'manage_admins',
  MANAGE_AGENTS: 'manage_agents',
  MANAGE_CITIZENS: 'manage_citizens',
  MANAGE_CATALOG: 'manage_catalog',
  MANAGE_APPLICATIONS: 'manage_applications',
  MANAGE_PAYMENTS: 'manage_payments',
  MANAGE_SETTLEMENTS: 'manage_settlements',
  MANAGE_TICKETS: 'manage_tickets',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SETTINGS: 'manage_settings',
};
