import { client } from './client.js';

/**
 * The service endpoints, one function per backend route (backend/src/routes/
 * service.routes.js, admin-only throughout).
 *
 * Anything other than a 2xx makes axios throw, so reaching a return means the
 * call worked. Every response uses the same envelope — `{ success, statusCode,
 * message, data }` — so these unwrap `data`.
 */

/**
 * Create a service.
 *
 * `formFields` travels inside the body: it is an embedded array on the Service
 * document, not a collection of its own, so this is one request and one
 * document. `slug` is not sent — the schema derives it from the name — and no
 * status is sent either, so the service is created as a draft.
 *
 * Returns the created service.
 */
export async function createService(payload) {
  const response = await client.post('/services', payload);

  return response.data.data.service;
}

/**
 * The service list.
 *
 * Rows carry `formFieldCount` and a populated department, and leave the form
 * itself out — a table shows none of it, and it is the largest thing on the
 * document.
 *
 * Returns `{ services, statusCounts, pagination }`.
 */
export async function listServices({ page, limit, search, status, department } = {}) {
  const response = await client.get('/services', {
    // Undefined values are dropped by axios, so an unfiltered call sends no
    // query string at all rather than `?status=undefined`.
    params: {
      page,
      limit,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
      department: department === 'all' ? undefined : department,
    },
  });

  return response.data.data;
}

/**
 * The service categories a service can be filed under.
 *
 * `Service.category` references a `ServiceCategory` model that has not been
 * written yet, so this will 404 until it is. The form treats an empty list as
 * "no categories configured" rather than an error, because that is what it is —
 * the field is optional in the schema.
 */
export async function listServiceCategories() {
  const response = await client.get('/service-categories', { params: { limit: 100 } });

  return response.data.data.categories ?? [];
}

/**
 * One service, including its `formFields` — which the list leaves out.
 *
 * The edit form loads through here rather than reusing the row it was opened
 * from, because that row has no form on it.
 */
export async function getService(serviceId) {
  const response = await client.get(`/services/${serviceId}`);

  return response.data.data.service;
}

/**
 * Edit a service.
 *
 * `formFields` replaces the stored array wholesale when it is sent — the
 * builder edits the whole form, so it sends the whole form. `slug` is not
 * accepted: it is derived once at creation so a reworded service keeps the
 * address citizens already have.
 */
export async function updateService(serviceId, payload) {
  const response = await client.patch(`/services/${serviceId}`, payload);

  return response.data.data.service;
}

/**
 * Delete a service.
 *
 * Refused with a 409 once applications have been filed against it — the message
 * says how many. A service with history is archived through
 * `updateService({ status: 'inactive' })` instead.
 */
export async function deleteService(serviceId) {
  const response = await client.delete(`/services/${serviceId}`);

  return response.data.data;
}

export default {
  createService,
  getService,
  updateService,
  deleteService,
  listServices,
  listServiceCategories,
};
