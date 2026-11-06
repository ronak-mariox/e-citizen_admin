/**
 * The notification centre — backend NOTIFICATION_TYPE (constants/statuses.js),
 * with how each reads on this console.
 *
 * `tone` keys into the same `.audit-action--{tone}` dot the Audit Log already
 * draws its action column with, so a notification's colour means the same
 * thing everywhere in this console rather than inventing a second palette.
 */
export const NOTIFICATION_TYPES = [
  { id: 'assignments', label: 'Assignments', tone: 'blue' },
  { id: 'verification', label: 'Verification', tone: 'violet' },
  { id: 'customer', label: 'Applicant Activity', tone: 'green' },
  { id: 'sla', label: 'SLA & Escalations', tone: 'red' },
  { id: 'system', label: 'System', tone: 'slate' },
  { id: 'processing', label: 'Case Processing', tone: 'blue' },
  { id: 'visits', label: 'Government Visits', tone: 'amber' },
  { id: 'acknowledgements', label: 'Acknowledgements', tone: 'green' },
  { id: 'support', label: 'Support Tickets', tone: 'amber' },
  { id: 'payments', label: 'Agent 2 Payouts', tone: 'red' },
];

export const NOTIFICATION_TONE = Object.fromEntries(
  NOTIFICATION_TYPES.map((type) => [type.id, type.tone])
);

export const NOTIFICATION_LABEL = Object.fromEntries(
  NOTIFICATION_TYPES.map((type) => [type.id, type.label])
);
