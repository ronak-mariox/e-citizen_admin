import { client } from './client.js';

/**
 * Support tickets, as the console works them — backend
 * src/routes/adminSupportTicket.routes.js. Admin-only server-side.
 *
 * `/admin/tickets` and not `/support/tickets`: that path is the citizen's and
 * returns only their own tickets, with internal notes stripped. This one is the
 * whole platform, notes included.
 */

/**
 * The table. `search` covers the ticket number, the subject and the citizen —
 * by name or mobile. `assignee` is an admin id, `me` or `unassigned`. Returns
 * `{ tickets, statusCounts, pagination }`; `statusCounts` ignores the status
 * filter, so the filter keeps its totals while one status is selected.
 */
export async function listTickets({ page, limit, search, status, category, priority, assignee } = {}) {
  const response = await client.get('/admin/tickets', {
    params: {
      page,
      limit,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
      category: category === 'all' ? undefined : category,
      priority: priority === 'all' ? undefined : priority,
      assignee: assignee === 'all' ? undefined : assignee,
    },
  });

  return response.data.data;
}

/** One ticket in full — the whole thread, internal notes and status history. */
export async function getTicket(ticketId) {
  const response = await client.get(`/admin/tickets/${ticketId}`);

  return response.data.data.ticket;
}

/** Every active admin a ticket can be given to. */
export async function listAssignees() {
  const response = await client.get('/admin/tickets/assignees');

  return response.data.data.assignees;
}

/**
 * Write on the thread. `internal` keeps it among admins; otherwise the citizen
 * is notified and an unworked ticket moves to In Progress. Returns the ticket
 * as it now stands.
 */
export async function replyToTicket(ticketId, { text, internal = false }) {
  const response = await client.post(`/admin/tickets/${ticketId}/messages`, {
    text: text.trim(),
    internal,
  });

  return response.data.data.ticket;
}

/**
 * Status, priority and owner — send only what changed. `assignedTo: null`
 * unassigns. `note` rides on a status change and is shown to the citizen.
 */
export async function updateTicket(ticketId, { status, priority, assignedTo, note }) {
  const response = await client.patch(`/admin/tickets/${ticketId}`, {
    status,
    priority,
    assignedTo,
    note: note?.trim() || undefined,
  });

  return response.data.data.ticket;
}
