import { client } from './client.js';

/**
 * The signed-in admin's own account (backend/src/routes/admin.routes.js).
 *
 * `/me` throughout — the account is the one the token belongs to, so there is
 * no id to pass and no way to aim these at somebody else's record.
 *
 * Anything other than a 2xx makes axios throw, so reaching a return means the
 * call worked. Every response uses the same envelope — `{ success, statusCode,
 * message, data }` — so these unwrap `data`.
 */

/** The account behind the current session. */
export async function getMyAccount() {
  const response = await client.get('/admins/me');

  return response.data.data.user;
}

/**
 * Edit your own name, designation and contact number.
 *
 * Nothing else is accepted: the email is the login identifier, the password has
 * its own route, and role, permissions and status are privileges rather than
 * profile fields. The API drops them rather than trusting the form.
 *
 * Returns the account in the same shape sign-in and /auth/me use, so the caller
 * can put it straight back into the stored session.
 */
export async function updateMyAccount(payload) {
  const response = await client.patch('/admins/me', payload);

  return response.data.data.user;
}

/**
 * What the API is configured with — what Settings › System Config renders.
 *
 * A whitelist built server-side, not a dump of the environment — a variable
 * added to the API's .env tomorrow is not published by accident.
 *
 * By default the connection strings arrive reduced to their host and the
 * secrets are absent entirely. Pass `{ reveal: true }` to get them in full;
 * that request is recorded in the audit trail.
 */
export async function getSystemConfig({ reveal = false } = {}) {
  const response = await client.get('/admins/system-config', {
    // Only with `reveal` does the response carry the connection strings and
    // signing secrets, and only then is the read written to the audit trail —
    // so loading Settings does not put credentials in the browser.
    params: reveal ? { reveal: 'true' } : undefined,
  });

  return response.data.data.config;
}

export default { getMyAccount, updateMyAccount, getSystemConfig };
