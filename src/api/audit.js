import { client } from './client.js';

/**
 * The audit trail. Read-only — entries are written by the API services that
 * make the change, never posted by a client.
 *
 * Returns `{ logs, areas, pagination }`. `areas` is derived from the rows that
 * exist rather than a fixed list, so a section that starts recording later
 * appears in its own filter without anything here changing.
 */
export async function listAuditLogs({ page, limit, search, area, action } = {}) {
  const response = await client.get('/audit-logs', {
    // Undefined values are dropped by axios, so an unfiltered call sends no
    // query string at all rather than `?area=undefined`.
    params: {
      page,
      limit,
      search: search || undefined,
      area: area === 'all' ? undefined : area,
      action: action || undefined,
    },
  });

  return response.data.data;
}

export default { listAuditLogs };
