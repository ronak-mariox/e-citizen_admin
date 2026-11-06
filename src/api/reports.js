import { client } from './client.js';

/**
 * The console's Reports — backend src/routes/report.routes.js. Admin-only.
 *
 * Every report answers in the same shape (see report.service.js): summary
 * tiles, an optional trend, breakdowns, one table and notes on what the
 * platform does not record. Money is paise.
 *
 * @param {string} type applications | wallet | settlements | users | services | agents | support
 * @param {{ from?: string, to?: string, department?: string }} filters
 *   Dates are YYYY-MM-DD, both inclusive.
 */
export async function getReport(type, { from, to, department } = {}) {
  const response = await client.get(`/admin/reports/${type}`, {
    params: { from, to, department: department === 'all' ? undefined : department || undefined },
  });

  return response.data.data.report;
}
