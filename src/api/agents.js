import { client } from './client.js';

/**
 * The agent endpoints, one function per backend route. Admin-only server-side.
 *
 * Anything other than a 2xx makes axios throw, so reaching a return means the
 * call worked. Every response uses the same envelope — `{ success, statusCode,
 * message, data }` — so these unwrap `data`.
 */

/**
 * Open an agent account.
 *
 * No `employeeId` is sent: it is derived from the department's code and the
 * agent's level, and its trailing sequence is allocated atomically server-side
 * (backend/src/utils/employeeId.js). Two admins creating an agent at the same
 * moment would otherwise propose the same ID.
 *
 * Returns the created agent, including the issued employee ID and its populated
 * department — enough to show the result without a second request.
 */
export async function createAgent(payload) {
  const response = await client.post('/agents', payload);

  return response.data.data.agent;
}

/**
 * The roster.
 *
 * `search` covers employee ID, name and mobile. Returns
 * `{ agents, statusCounts, pagination }` — `statusCounts` is computed ignoring
 * the status filter, so the tabs keep their totals while one is selected.
 */
export async function listAgents({ page, limit, search, role, status, department } = {}) {
  const response = await client.get('/agents', {
    // Undefined values are dropped by axios, so an unfiltered call sends no
    // query string at all rather than `?status=undefined`.
    params: {
      page,
      limit,
      search: search || undefined,
      role: role === 'all' ? undefined : role,
      status: status === 'all' ? undefined : status,
      department: department === 'all' ? undefined : department,
    },
  });

  return response.data.data;
}

/**
 * Move an agent through the account lifecycle — suspend, reactivate, and the
 * rest of USER_STATUS.
 *
 * Anything other than `active` ends the agent's session at once: the API
 * refuses their next request and clears their refresh token, so they are signed
 * out rather than left working until it expires.
 *
 * `reason` is optional but worth sending — a suspension nobody can explain is
 * one nobody can safely lift.
 */
export async function updateAgentStatus(agentId, { status, reason } = {}) {
  const response = await client.patch(`/agents/${agentId}/status`, { status, reason });

  return response.data.data.agent;
}

/** One agent, with department, assigned services, profile and creator populated. */
export async function getAgent(agentId) {
  const response = await client.get(`/agents/${agentId}`);

  return response.data.data.agent;
}

/**
 * Remove an agent from the roster.
 *
 * A soft delete server-side: the record is kept — applications and the audit
 * trail point at it — and the account is hidden and locked out instead. So it
 * disappears from every list here, but nothing that referred to it breaks, and
 * its employee ID is never handed to someone else.
 *
 * Returns the deleted agent, so a notice can name it without the caller holding
 * on to the row it has just removed.
 */
export async function deleteAgent(agentId) {
  const response = await client.delete(`/agents/${agentId}`);

  return response.data.data.agent;
}

export default { createAgent, listAgents, getAgent, updateAgentStatus, deleteAgent };
