import { client } from './client.js';

/**
 * The company wallet and the payouts to Agent 2 — backend
 * src/routes/adminWallet.routes.js. Admin-only server-side.
 *
 * Every citizen payment lands in the company wallet; the admin then pays each
 * Agent 2 their share from it, and the rest stays with the company. Agent 1 is
 * never paid. Money is paise on the API, as everywhere.
 */

/** Balance, lifetime totals, and how much Agent 2 is still owed. */
export async function getWallet() {
  const response = await client.get('/admin/wallet');

  return response.data.data.wallet;
}

/** The ledger, newest first. `direction` is credit | debit. */
export async function listTransactions({ page, limit, direction, type } = {}) {
  const response = await client.get('/admin/wallet/transactions', {
    params: {
      page,
      limit,
      direction: direction === 'all' ? undefined : direction,
      type: type === 'all' ? undefined : type,
    },
  });

  return response.data.data;
}

/** Applications whose Agent 2 is still owed their share by the default split. */
export async function listPayoutsDue({ page, limit } = {}) {
  const response = await client.get('/admin/wallet/payouts-due', { params: { page, limit } });

  return response.data.data;
}

/** Every payout already made, newest first. */
export async function listPayouts({ page, limit, agent } = {}) {
  const response = await client.get('/admin/wallet/payouts', { params: { page, limit, agent } });

  return response.data.data;
}

/** One application's money — what came in, what went out, the default split. */
export async function getApplicationMoney(applicationId) {
  const response = await client.get(`/admin/wallet/applications/${applicationId}`);

  return response.data.data.application;
}

/**
 * Pay this application's Agent 2 `amount` paise from the company wallet. The
 * recipient is the application's own Agent 2 — it cannot be chosen here.
 */
export async function releasePayout(applicationId, { amount, purpose, method, reference, note }) {
  const response = await client.post(`/admin/wallet/applications/${applicationId}/payouts`, {
    amount,
    purpose: purpose || undefined,
    method: method || undefined,
    reference: reference?.trim() || undefined,
    note: note?.trim() || undefined,
  });

  return response.data.data.application;
}
