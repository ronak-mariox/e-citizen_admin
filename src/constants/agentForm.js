/* Options for the "create agent" form.

   The admin creates the login account only — backend/src/models/agent.js. The
   profile (personal details, address, bank account, KYC files) is the agent's
   own to fill in from their app after the first sign-in, so none of it is asked
   for here. What the admin does decide is the work scope, because that is what
   routes applications, and which onboarding documents were collected.

   Every list below is copied from the backend so a dropdown can never offer a
   value Mongo would reject:
     backend/src/models/agent.js       -> the account fields
     backend/src/constants/roles.js    -> roles and levels
     backend/src/constants/statuses.js -> USER_STATUS
     backend/src/utils/employeeId.js   -> how the employee ID is built

   Agent 1 and Agent 2 share one schema — only `role` differs. `code` is the
   level's segment in an employee ID, and it matches LEVEL_CODES on the API. */

export const AGENT_LEVELS = [
  {
    level: 'l1',
    role: 'agent_1',
    code: 'A1',
    label: 'Agent 1',
    tagline: 'Verification desk',
    duties: 'Verification, document review and citizen follow-up',
  },
  {
    level: 'l2',
    role: 'agent_2',
    code: 'A2',
    label: 'Agent 2',
    tagline: 'Department desk',
    duties: 'Department follow-up, manual submission and escalation',
  },
];

/** USER_STATUS in full — an account either works or it does not. */
export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active — can sign in now' },
  { value: 'inactive', label: 'Inactive — cannot sign in yet' },
];

/* The whole lifecycle, which is now two states. Why an account was deactivated
   — onboarding, a hold, misconduct, someone leaving — is the reason recorded
   with the change rather than a status of its own.

   `note` is the consequence: deactivating ends the agent's session the moment
   it is saved, because the API clears their refresh token rather than letting
   them work until it expires. */
export const EDIT_STATUS_OPTIONS = [
  {
    value: 'active',
    label: 'Active — can sign in',
    note: 'The account works normally.',
  },
  {
    value: 'inactive',
    label: 'Inactive — cannot sign in',
    note: 'Signs the agent out of every device at once. Say why in the reason box — it is the only record of which kind of inactive this is.',
  },
];

export const statusNote = (value) =>
  EDIT_STATUS_OPTIONS.find((option) => option.value === value)?.note ?? '';

/* What an agent can be asked to hand in on their first sign-in.

   Copied from backend/src/constants/agentDocuments.js — the API validates
   against that same list, so a value only present here is one the server
   refuses, and a label that drifts from it is an admin ticking "Bank account
   details" while the agent's console asks for a "Passbook".

   Four entries, and education is one of them rather than three: the requirement
   is the 10th, the 12th *or* the degree, whichever the agent has. The agent
   picks which when they upload, and it comes back on the document as its
   variant — so there is nothing for an admin to choose between here. */
export const DOCUMENT_OPTIONS = [
  { value: 'aadhaar_card', label: 'Aadhaar card' },
  { value: 'pan_card', label: 'PAN card' },
  { value: 'bank_details', label: 'Bank account details' },
  {
    value: 'education',
    label: 'Education certificate',
    hint: '10th, 12th or graduation — the agent sends whichever they have',
  },
];

export const documentLabel = (value) =>
  DOCUMENT_OPTIONS.find((option) => option.value === value)?.label ?? value;

/** EDUCATION_VARIANT_LABELS on the API — what came back on an education row. */
export const VARIANT_LABELS = {
  '10th': '10th certificate',
  '12th': '12th certificate',
  graduation: 'Graduation certificate',
};

export const variantLabel = (variant) => VARIANT_LABELS[variant] ?? variant;

/* What a new form starts with — DEFAULT_REQUIRED_DOCUMENTS on the API, kept in
   step so an admin who changes nothing gets the same list either way.

   All four for both levels: an Agent 1 and an Agent 2 are the same person as
   far as identity, tax, payout and schooling go. Any of them can still be
   unticked per account, and an empty list is a real answer meaning the agent is
   asked for nothing. */
const ALL_DOCUMENTS = DOCUMENT_OPTIONS.map((option) => option.value);

export const REQUIRED_DOCUMENTS = {
  l1: ALL_DOCUMENTS,
  l2: ALL_DOCUMENTS,
};

/** INDIAN_MOBILE_REGEX from models/common_schema.js. */
export const MOBILE_PATTERN = '[6-9][0-9]{9}';

export const findLevel = (level) =>
  AGENT_LEVELS.find((item) => item.level === level) ?? AGENT_LEVELS[0];

/**
 * What the employee ID will look like — E-REV-A1-####.
 *
 * The trailing digits stay hashes rather than guessing 0001, because the real
 * number is allocated by the API at the moment of insert
 * (backend/src/utils/employeeId.js) and nothing the browser knows can predict
 * it. Showing a number here that the account then did not get would be worse
 * than showing none.
 */
export function previewEmployeeId(departmentCode, level) {
  return `E-${departmentCode || '····'}-${findLevel(level).code}-####`;
}

/** Blank form, carrying the defaults the schema declares. */
export function emptyAgentForm(level = 'l1') {
  return {
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    status: 'active',
    department: '',
    services: [],
    // Pre-ticked rather than empty: these are what the API would have chosen
    // anyway, and starting from nothing invites an account created with no
    // checklist at all by an admin who never scrolled that far. Copied, so
    // toggling a chip cannot edit the shared default list itself.
    documents: [...(REQUIRED_DOCUMENTS[level] ?? [])],
  };
}

/**
 * Form state -> the Agent document the API creates.
 *
 * No `employeeId`: it is derived from the department and the level, and the
 * sequence at the end of it has to be allocated atomically, which only the API
 * can do. Letting the browser propose one would mean two admins creating an
 * agent at the same moment could both send the same ID.
 *
 * `requiredDocuments` is the checklist the agent meets on their first sign-in,
 * not files — the agent uploads those themselves, into the dialog their console
 * opens before it lets them at the dashboard.
 */
export function buildAgentPayload(form, level) {
  return {
    fullName: form.fullName.trim(),
    mobile: form.mobile.trim(),
    // Lowercased to match how the account stores it, so a duplicate typed in
    // capitals is caught as one rather than opening a second account.
    email: form.email.trim().toLowerCase(),
    password: form.password,
    role: findLevel(level).role,
    status: form.status,
    department: form.department,
    assignedServices: form.services,
    requiredDocuments: form.documents,
  };
}
