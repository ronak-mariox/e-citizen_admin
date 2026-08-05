/** Copy for the brand panel and the sidebar header. Kept here so the auth
    screens stay presentational and a rename never means hunting through JSX. */
export const BRAND = {
  name: 'eCitizen',
  /** Shown beside the wordmark on the auth panel. */
  portal: 'eCitizen Portal',
  org: 'Government of India · Administration Console',
  /** Short label under the wordmark in the sidebar, where the full org line
      would not fit. */
  console: 'Admin Console',
  headline: 'Run the platform, not just the queue.',
  copy:
    'Provision staff, publish the service catalog, oversee every application and settle agent commissions — from one governed workspace.',
  ministry: 'Ministry of Electronics & Information Technology',
  notice: 'Privileged Access · All Actions Audited',
};

/** Where "contact IT support" points. */
export const SUPPORT_EMAIL = 'helpdesk@ecitizen.gov.in';
export const SUPPORT_PHONE = '1800-111-222';

export default BRAND;
