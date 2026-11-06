import { client } from './client.js';

/**
 * The stat tiles on the admin console's home screen.
 *
 * Platform-wide counts, unlike `/agent/dashboard` which is one Agent 1's own
 * queue. Returns `{ applicationsToday, awaitingVerification, slaBreached,
 * agentsOnline, agentsTotal, registeredCitizens, activeDepartments }`.
 */
export async function getDashboardStats() {
  const response = await client.get('/admin/dashboard/stats');

  return response.data.data.stats;
}

export default { getDashboardStats };
