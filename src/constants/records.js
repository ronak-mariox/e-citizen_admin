/* Sample rows for the list screens.

   Field names follow the backend models (agent.js, citizen.js, and the
   application schema in docs/backend-design.md) so wiring these tables to the
   API is a matter of deleting these arrays, not of renaming every cell. Status
   values are the raw enum strings — the screens run them through
   constants/statusTone.js exactly as they will run API values. */

export const AGENTS = [
  {
    id: 'E-REV-A1-0001',
    fullName: 'Ravi Kumar',
    email: 'ravi.kumar@ecitizen.gov.in',
    mobile: '98765 43210',
    level: 'l1',
    department: 'Revenue',
    assigned: 24,
    completed: 318,
    status: 'active',
    lastActive: '4m ago',
  },
  {
    id: 'E-REG-A2-0001',
    fullName: 'Meera Nair',
    email: 'meera.nair@ecitizen.gov.in',
    mobile: '98765 43211',
    level: 'l2',
    department: 'Registration',
    assigned: 17,
    completed: 402,
    status: 'active',
    lastActive: '12m ago',
  },
  {
    id: 'E-URB-A1-0001',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@ecitizen.gov.in',
    mobile: '98765 43212',
    level: 'l1',
    department: 'Urban Development',
    assigned: 31,
    completed: 276,
    status: 'active',
    lastActive: '1h ago',
  },
  {
    id: 'E-TRN-A2-0001',
    fullName: 'Arun Joshi',
    email: 'arun.joshi@ecitizen.gov.in',
    mobile: '98765 43213',
    level: 'l2',
    department: 'Transport',
    assigned: 9,
    completed: 154,
    status: 'suspended',
    lastActive: '6d ago',
  },
  {
    id: 'E-SWL-A1-0001',
    fullName: 'Nisha Gupta',
    email: 'nisha.gupta@ecitizen.gov.in',
    mobile: '98765 43214',
    level: 'l1',
    department: 'Social Welfare',
    assigned: 0,
    completed: 0,
    status: 'pending',
    lastActive: 'Never',
  },
  {
    id: 'E-REV-A2-0001',
    fullName: 'Deepak Mishra',
    email: 'deepak.mishra@ecitizen.gov.in',
    mobile: '98765 43215',
    level: 'l2',
    department: 'Revenue',
    assigned: 21,
    completed: 289,
    status: 'active',
    lastActive: '38m ago',
  },
  {
    id: 'E-URB-A1-0002',
    fullName: 'Anand Verma',
    email: 'anand.verma@ecitizen.gov.in',
    mobile: '98765 43216',
    level: 'l1',
    department: 'Urban Development',
    assigned: 0,
    completed: 96,
    status: 'inactive',
    lastActive: '21d ago',
  },
];

export const AGENT_LEVEL_LABEL = { l1: 'Agent 1', l2: 'Agent 2' };

/* Back-office accounts — backend/src/models/admin.js.

   Admin is the top role; there is no tier above it, so every account here holds
   the whole capability list rather than a subset. `designation` is what tells
   two admins apart on screen, and it is a free-text field on the model, not a
   permission boundary.

   An empty `departments` list means every department. Note the model has no
   employeeId — admins sign in with their email — so `id` is a record handle
   only, never a credential. */

const ALL_ADMIN_PERMISSIONS = [
  'manage_admins',
  'manage_agents',
  'manage_citizens',
  'manage_catalog',
  'manage_applications',
  'manage_payments',
  'manage_settlements',
  'manage_tickets',
  'view_reports',
  'manage_settings',
];

export const ADMINS = [
  {
    id: 'adm-0001',
    fullName: 'System Administrator',
    email: 'admin@ecitizen.gov.in',
    mobile: '98765 00000',
    designation: 'Administrator',
    permissions: ALL_ADMIN_PERMISSIONS,
    departments: [],
    status: 'active',
    lastActive: 'Just now',
  },
  {
    id: 'adm-0004',
    fullName: 'Kavya Rao',
    email: 'kavya.rao@ecitizen.gov.in',
    mobile: '98765 00004',
    designation: 'Operations Manager',
    permissions: ALL_ADMIN_PERMISSIONS,
    departments: ['dept-revenue'],
    status: 'active',
    lastActive: '22m ago',
  },
  {
    id: 'adm-0009',
    fullName: 'Sanjay Patil',
    email: 'sanjay.patil@ecitizen.gov.in',
    mobile: '98765 00009',
    designation: 'Catalogue Officer',
    permissions: ALL_ADMIN_PERMISSIONS,
    departments: ['dept-urban', 'dept-transport'],
    status: 'active',
    lastActive: '2h ago',
  },
  {
    id: 'adm-0012',
    fullName: 'Neha Bhatt',
    email: 'neha.bhatt@ecitizen.gov.in',
    mobile: '98765 00012',
    designation: 'Finance Controller',
    permissions: ALL_ADMIN_PERMISSIONS,
    departments: [],
    status: 'inactive',
    lastActive: '9d ago',
  },
];

/* Catalogue lists the create-agent form picks from, and the tables on the
   settings catalogue tabs. These come from the departments and services
   collections once those endpoints exist — `status` is CATALOG_STATUS. */
export const DEPARTMENTS = [
  { id: 'dept-revenue', name: 'Revenue', code: 'REV', head: 'Kavya Rao', status: 'active' },
  { id: 'dept-urban', name: 'Urban Development', code: 'URB', head: 'Sanjay Patil', status: 'active' },
  { id: 'dept-registration', name: 'Registration', code: 'REG', head: 'Unassigned', status: 'active' },
  { id: 'dept-transport', name: 'Transport', code: 'TRN', head: 'Sanjay Patil', status: 'active' },
  { id: 'dept-welfare', name: 'Social Welfare', code: 'SWL', head: 'Unassigned', status: 'draft' },
];

/* `fee` is what the citizen is billed in whole rupees — the schema keeps it in
   paise (see backend/src/models/service.js), the console shows rupees. */
export const SERVICES = [
  { id: 'svc-ec', name: 'Encumbrance Certificate', code: 'EC', department: 'dept-revenue', fee: 350, slaHours: 48, status: 'active' },
  { id: 'svc-income', name: 'Income Certificate', code: 'INC', department: 'dept-revenue', fee: 120, slaHours: 24, status: 'active' },
  { id: 'svc-trade', name: 'Trade Licence Renewal', code: 'TLR', department: 'dept-revenue', fee: 900, slaHours: 72, status: 'active' },
  { id: 'svc-plan', name: 'Building Plan Approval', code: 'BPA', department: 'dept-urban', fee: 2400, slaHours: 240, status: 'active' },
  { id: 'svc-zone', name: 'Zone Certificate', code: 'ZC', department: 'dept-urban', fee: 500, slaHours: 96, status: 'inactive' },
  { id: 'svc-deed', name: 'Sale Deed Registration', code: 'SDR', department: 'dept-registration', fee: 1800, slaHours: 120, status: 'active' },
  { id: 'svc-dl', name: 'Driving Licence Renewal', code: 'DLR', department: 'dept-transport', fee: 700, slaHours: 72, status: 'active' },
  { id: 'svc-pension', name: 'Pension Enrolment', code: 'PEN', department: 'dept-welfare', fee: 0, slaHours: 168, status: 'draft' },
];

export const CITIZENS = [
  {
    id: 'CTZ-018402',
    fullName: 'Rajesh Kumar',
    mobile: '99887 76650',
    email: 'rajesh.k@example.com',
    district: 'Bengaluru Urban',
    applications: 6,
    walletBalance: 1250,
    status: 'active',
    joined: '12 Jan 2026',
  },
  {
    id: 'CTZ-018411',
    fullName: 'Sunita Rao',
    mobile: '99887 76651',
    email: 'sunita.rao@example.com',
    district: 'Mysuru',
    applications: 2,
    walletBalance: 480,
    status: 'active',
    joined: '19 Feb 2026',
  },
  {
    id: 'CTZ-018433',
    fullName: 'Imran Sheikh',
    mobile: '99887 76652',
    email: 'imran.sheikh@example.com',
    district: 'Belagavi',
    applications: 11,
    walletBalance: 0,
    status: 'active',
    joined: '03 Mar 2026',
  },
  {
    id: 'CTZ-018447',
    fullName: 'Rakesh Yadav',
    mobile: '99887 76653',
    email: 'rakesh.yadav@example.com',
    district: 'Kalaburagi',
    applications: 4,
    walletBalance: 90,
    status: 'suspended',
    joined: '28 Mar 2026',
  },
  {
    id: 'CTZ-018469',
    fullName: 'Lakshmi Devi',
    mobile: '99887 76654',
    email: 'lakshmi.d@example.com',
    district: 'Mangaluru',
    applications: 1,
    walletBalance: 2000,
    status: 'pending',
    joined: '02 Aug 2026',
  },
  {
    id: 'CTZ-018470',
    fullName: 'Vikram Singh',
    mobile: '99887 76655',
    email: 'vikram.singh@example.com',
    district: 'Bengaluru Urban',
    applications: 8,
    walletBalance: 3400,
    status: 'active',
    joined: '11 Apr 2026',
  },
  {
    id: 'CTZ-018488',
    fullName: 'Fatima Begum',
    mobile: '99887 76656',
    email: 'fatima.b@example.com',
    district: 'Vijayapura',
    applications: 3,
    walletBalance: 0,
    status: 'blocked',
    joined: '22 May 2026',
  },
];

export const APPLICATIONS = [
  {
    id: 'APP-2026-04182',
    citizen: 'Rajesh Kumar',
    citizenId: 'CTZ-018402',
    service: 'Encumbrance Certificate',
    department: 'Revenue',
    agent: 'Meera Nair',
    priority: 'high',
    status: 'submitted_to_department',
    updated: '4m ago',
  },
  {
    id: 'APP-2026-04179',
    citizen: 'Sunita Rao',
    citizenId: 'CTZ-018411',
    service: 'Building Plan Approval',
    department: 'Urban Development',
    agent: 'Priya Sharma',
    priority: 'urgent',
    status: 'escalated',
    updated: '26m ago',
  },
  {
    id: 'APP-2026-04175',
    citizen: 'Imran Sheikh',
    citizenId: 'CTZ-018433',
    service: 'Property Tax Assessment',
    department: 'Revenue',
    agent: 'Ravi Kumar',
    priority: 'normal',
    status: 'under_verification',
    updated: '1h ago',
  },
  {
    id: 'APP-2026-04168',
    citizen: 'Vikram Singh',
    citizenId: 'CTZ-018470',
    service: 'Driving Licence Renewal',
    department: 'Transport',
    agent: 'Arun Joshi',
    priority: 'normal',
    status: 'query_raised',
    updated: '2h ago',
  },
  {
    id: 'APP-2026-04161',
    citizen: 'Lakshmi Devi',
    citizenId: 'CTZ-018469',
    service: 'Income Certificate',
    department: 'Revenue',
    agent: 'Deepak Mishra',
    priority: 'low',
    status: 'pending_payment',
    updated: '3h ago',
  },
  {
    id: 'APP-2026-04150',
    citizen: 'Fatima Begum',
    citizenId: 'CTZ-018488',
    service: 'Sale Deed Registration',
    department: 'Registration',
    agent: 'Meera Nair',
    priority: 'high',
    status: 'completed',
    updated: '5h ago',
  },
  {
    id: 'APP-2026-04143',
    citizen: 'Rakesh Yadav',
    citizenId: 'CTZ-018447',
    service: 'Zone Certificate',
    department: 'Urban Development',
    agent: 'Priya Sharma',
    priority: 'normal',
    status: 'rejected',
    updated: '8h ago',
  },
  {
    id: 'APP-2026-04138',
    citizen: 'Rajesh Kumar',
    citizenId: 'CTZ-018402',
    service: 'Trade Licence Renewal',
    department: 'Revenue',
    agent: 'Unassigned',
    priority: 'normal',
    status: 'submitted',
    updated: '11h ago',
  },
];
