/** How the ledger names its rows — backend TRANSACTION_TYPE. */
export const TRANSACTION_LABEL = {
  service_fee: 'Application fee',
  additional_fee: 'Additional payment',
  agent_payout: 'Payout to Agent 2',
  recharge: 'Recharge',
  manual_credit: 'Manual credit',
  refund: 'Refund',
  reversal: 'Reversal',
  adjustment: 'Adjustment',
  commission_payout: 'Commission payout',
  penalty: 'Penalty',
};

/** PAYMENT_METHOD, as the console names them. */
export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'demand_draft', label: 'Demand draft' },
  { value: 'other', label: 'Other' },
];

/** PAYOUT_PURPOSE — what a payout to Agent 2 is for. */
export const PAYOUT_PURPOSES = [
  { value: 'service', label: 'Service share' },
  { value: 'additional', label: 'Additional payment' },
];

export const PAYOUT_PURPOSE_LABEL = Object.fromEntries(PAYOUT_PURPOSES.map((one) => [one.value, one.label]));

export const PAYMENT_METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map((one) => [one.value, one.label]));
