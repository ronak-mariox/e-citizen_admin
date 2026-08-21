import { client } from './client.js';

/**
 * Citizens, as the back office reads them — backend
 * src/routes/adminCitizen.routes.js. Admin-only server-side.
 *
 * `/admin/citizens` and not `/profile`: that one is a citizen reading their own
 * account. This is the platform's roster of all of them.
 *
 * Anything other than a 2xx makes axios throw, so reaching a return means the
 * call worked. Every response uses the same envelope — `{ success, statusCode,
 * message, data }` — so these unwrap `data`.
 */

/**
 * The roster.
 *
 * `search` covers the mobile number and the citizen's name — which lives on
 * their profile rather than on the account they sign in with, so a search that
 * only looked at the account would find almost nobody. Returns
 * `{ citizens, statusCounts, pagination }`; `statusCounts` is computed ignoring
 * the status filter, so the tabs keep their totals while one is selected.
 */
export async function listCitizens({ page, limit, search, status } = {}) {
  const response = await client.get('/admin/citizens', {
    // Undefined values are dropped by axios, so an unfiltered call sends no
    // query string at all rather than `?status=undefined`.
    params: {
      page,
      limit,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
    },
  });

  return response.data.data;
}

/** One citizen, with the whole profile they filled in. */
export async function getCitizen(citizenId) {
  const response = await client.get(`/admin/citizens/${citizenId}`);

  return response.data.data.citizen;
}
