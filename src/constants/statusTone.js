/**
 * How a backend status renders.
 *
 * The console shows the same application on the dashboard, in the applications
 * table and (later) on a detail page. Mapping status -> { label, tone } once
 * here is what stops "under_verification" being amber in one place and violet
 * in another, and it means a new backend status shows up as a plain slate pill
 * rather than an unstyled string.
 *
 * Keys mirror backend/src/constants/statuses.js. `tone` keys into the
 * .pill--* / .tag--* modifiers in styles/dashboard.css.
 */

const fallback = (value) => ({
  label: String(value ?? '—').replace(/_/g, ' '),
  tone: 'slate',
});

/** Application workflow — APPLICATION_STATUS. */
export const APPLICATION_STATUS_TONE = {
  draft: { label: 'Draft', tone: 'slate' },
  submitted: { label: 'Submitted', tone: 'blue' },
  assigned: { label: 'Assigned', tone: 'blue' },
  under_verification: { label: 'Under Verification', tone: 'violet' },
  query_raised: { label: 'Query Raised', tone: 'amber' },
  reupload_requested: { label: 'Reupload Requested', tone: 'amber' },
  verified: { label: 'Verified', tone: 'green' },
  pending_payment: { label: 'Pending Payment', tone: 'orange' },
  pending_submission: { label: 'Pending Submission', tone: 'orange' },
  submitted_to_department: { label: 'With Department', tone: 'blue' },
  in_progress: { label: 'In Progress', tone: 'violet' },
  escalated: { label: 'Escalated', tone: 'red' },
  on_hold: { label: 'On Hold', tone: 'slate' },
  completed: { label: 'Completed', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
};

/** Account lifecycle — USER_STATUS, shared by all three account collections. */
export const USER_STATUS_TONE = {
  active: { label: 'Active', tone: 'green' },
  inactive: { label: 'Inactive', tone: 'slate' },
};

/**
 * An agent's onboarding documents — Agent.verificationStatus on the API.
 *
 * Separate from USER_STATUS_TONE above and not a substitute for it: the two
 * answer different questions. An account can be Active and still unable to work
 * because nobody has verified its paperwork, so both pills show on the roster
 * and neither one implies the other.
 *
 * Green only at the end. An admin scanning the column is looking for the rows
 * that need them, and three shades of "not done yet" that all read as fine
 * would hide exactly those.
 */
export const AGENT_VERIFICATION_TONE = {
  not_submitted: { label: 'Docs Pending', tone: 'slate' },
  in_review: { label: 'Review Docs', tone: 'amber' },
  rejected: { label: 'Docs Rejected', tone: 'red' },
  verified: { label: 'Docs Verified', tone: 'green' },
};

/** Publishing lifecycle — CATALOG_STATUS. */
export const CATALOG_STATUS_TONE = {
  active: { label: 'Active', tone: 'green' },
  inactive: { label: 'Inactive', tone: 'slate' },
};

/** APPLICATION_PRIORITY, rendered as a .tag rather than a .pill. */
export const PRIORITY_TONE = {
  low: { label: 'Low', tone: 'slate' },
  normal: { label: 'Normal', tone: 'slate' },
  high: { label: 'High', tone: 'amber' },
  urgent: { label: 'Urgent', tone: 'red' },
};

export const applicationStatus = (value) => APPLICATION_STATUS_TONE[value] ?? fallback(value);
export const agentVerification = (value) => AGENT_VERIFICATION_TONE[value] ?? fallback(value);
export const userStatus = (value) => USER_STATUS_TONE[value] ?? fallback(value);
export const catalogStatus = (value) => CATALOG_STATUS_TONE[value] ?? fallback(value);
export const priority = (value) => PRIORITY_TONE[value] ?? fallback(value);
