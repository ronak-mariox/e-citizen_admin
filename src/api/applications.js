import { client } from './client.js';

/**
 * Applications, as the back office reads them — backend
 * src/routes/adminApplication.routes.js. Admin-only server-side.
 *
 * `/admin/applications` and not `/applications`: the plain path belongs to the
 * citizen and returns only their own rows. This one is the whole platform.
 *
 * Anything other than a 2xx makes axios throw, so reaching a return means the
 * call worked. Every response uses the same envelope — `{ success, statusCode,
 * message, data }` — so these unwrap `data`.
 */

/**
 * The table.
 *
 * `search` covers the application and reference numbers, the service and
 * department it was filed under, and the citizen who filed it — by name or by
 * mobile. Returns `{ applications, statusCounts, pagination }`; `statusCounts`
 * is computed ignoring the status filter, so the filter keeps its totals while
 * one status is selected.
 */
export async function listApplications({
  page,
  limit,
  search,
  status,
  priority,
  department,
  service,
} = {}) {
  const response = await client.get('/admin/applications', {
    // Undefined values are dropped by axios, so an unfiltered call sends no
    // query string at all rather than `?status=undefined`.
    params: {
      page,
      limit,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
      priority: priority === 'all' ? undefined : priority,
      department: department === 'all' ? undefined : department,
      service: service === 'all' ? undefined : service,
    },
  });

  return response.data.data;
}

/** One application in full — answers, documents, fees and its whole timeline. */
export async function getApplication(applicationId) {
  const response = await client.get(`/admin/applications/${applicationId}`);

  return response.data.data.application;
}
