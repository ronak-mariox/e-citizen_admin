import { client } from './client.js';

/**
 * The department endpoints, one function per backend route.
 *
 * Anything other than a 2xx makes axios throw, so reaching a return means the
 * call worked. Every response uses the same envelope — `{ success, statusCode,
 * message, data }` — so these unwrap `data`.
 */

/**
 * Create a department.
 *
 * `slug` is not sent: the schema derives it from the name. `code` is immutable
 * once written, because it is baked into the employee ID of every agent the
 * department goes on to hire.
 *
 * Returns the created department, including the derived slug.
 */
export async function createDepartment(payload) {
  const response = await client.post('/departments', payload);

  return response.data.data.department;
}

/**
 * The department list.
 *
 * Rows carry `serviceCount` and `agentCount`, counted server-side — the console
 * used to derive them from its own sample arrays, which only worked while every
 * service and agent was already in the browser.
 *
 * Returns `{ departments, pagination }`.
 */
export async function listDepartments({ page, limit, search, status } = {}) {
  const response = await client.get('/departments', {
    // Undefined values are dropped by axios, so an unfiltered call sends no
    // query string at all rather than `?status=undefined`.
    params: { page, limit, search: search || undefined, status: status === 'all' ? undefined : status },
  });

  return response.data.data;
}

/**
 * Edit a department. Send only what changed.
 *
 * `code` is not accepted — the API rejects it outright rather than ignoring it,
 * because it is immutable once agents have been numbered under it.
 */
export async function updateDepartment(departmentId, payload) {
  const response = await client.patch(`/departments/${departmentId}`, payload);

  return response.data.data.department;
}

/**
 * Delete a department.
 *
 * Refused with a 409 while any service or agent still points at it — the
 * message names the counts. A department with history is archived through
 * `updateDepartment({ status: 'archived' })` instead.
 */
export async function deleteDepartment(departmentId) {
  const response = await client.delete(`/departments/${departmentId}`);

  return response.data.data;
}

/** One department, with the admin who created it populated. */
export async function getDepartment(departmentId) {
  const response = await client.get(`/departments/${departmentId}`);

  return response.data.data.department;
}

export default {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listDepartments,
  getDepartment,
};
