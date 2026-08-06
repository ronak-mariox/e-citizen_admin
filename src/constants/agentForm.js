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

/** USER_STATUS, minus the moderation outcomes — nothing is created suspended. */
export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active — can sign in now' },
  { value: 'pending', label: 'Pending — activate after onboarding' },
];

/** agentDocumentSchema.type — the government IDs plus onboarding paperwork. */
export const DOCUMENT_OPTIONS = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_license', label: 'Driving licence' },
  { value: 'passport', label: 'Passport' },
  { value: 'photo', label: 'Photograph' },
  { value: 'address_proof', label: 'Address proof' },
  { value: 'police_verification', label: 'Police verification' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'other', label: 'Other' },
];

/* The schema treats every document alike; these are the ones onboarding should
   not sign off without. An Agent 2 visits department counters with citizen
   papers, hence the extra two. */
export const REQUIRED_DOCUMENTS = {
  l1: ['photo', 'aadhaar', 'address_proof'],
  l2: ['photo', 'aadhaar', 'address_proof', 'police_verification', 'agreement'],
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
export function emptyAgentForm() {
  return {
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    status: 'active',
    department: '',
    services: [],
    documents: [],
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
 * `documents` rides alongside rather than inside it: the files themselves are
 * uploaded by the agent later, so this is only the list of what was collected
 * at onboarding.
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
    documents: form.documents,
  };
}
