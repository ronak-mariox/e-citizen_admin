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

/**
 * The Agent 1s this application could go to, ranked the way the engine ranks
 * them and carrying what each is currently holding.
 *
 * The same eligibility gate the assignment itself applies, so the picker cannot
 * offer somebody the assign call would then refuse.
 *
 * @param {string} applicationId
 * @param {'agent_1'|'agent_2'} [level] Which roster to list — defaults to
 *   Agent 1 on the backend when omitted.
 */
export async function listAssignableAgents(applicationId, level) {
  const response = await client.get(`/admin/applications/${applicationId}/assignable-agents`, {
    params: { level },
  });

  return response.data.data.agents;
}

/**
 * Move an application to a particular agent — Agent 1 or Agent 2.
 *
 * The override on an assignment the platform made by itself — or the first
 * assignment, for an application submitted when nobody was eligible. Returns
 * the application as it now stands, history included. `level` defaults to
 * Agent 1 on the backend when omitted, so every existing caller keeps working.
 */
export async function assignApplication(applicationId, { agentId, level, reason }) {
  const response = await client.post(`/admin/applications/${applicationId}/assign`, {
    agentId,
    level,
    reason: reason?.trim() || undefined,
  });

  return response.data.data.application;
}

/**
 * Grant an Agent 2's extension request — the admin's own edit of the case's
 * SLA hours. `days` left out grants the number asked for; passed, it can
 * approve fewer days than were asked. Returns the application as it now
 * stands, same as `assignApplication`.
 */
export async function approveExtensionRequest(applicationId, extensionRequestId, { days, note } = {}) {
  const response = await client.post(
    `/admin/applications/${applicationId}/extension-requests/${extensionRequestId}/approve`,
    { days, note: note?.trim() || undefined }
  );

  return response.data.data.application;
}

/** Refuse it. Grants no extra time, and tells the requesting Agent 2 why. */
export async function rejectExtensionRequest(applicationId, extensionRequestId, { note } = {}) {
  const response = await client.post(
    `/admin/applications/${applicationId}/extension-requests/${extensionRequestId}/reject`,
    { note: note?.trim() || undefined }
  );

  return response.data.data.application;
}
