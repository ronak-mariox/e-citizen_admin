/**
 * Third-party integration config — SMS, Email, Payment, Firebase
 * (Settings › System Config).
 *
 * One definition per type: what it's called, the copy `IntegrationsPanel`
 * draws around it, and the field schema that both the "Current
 * Configuration" summary grid and the "Update Credentials" form are built
 * from — the same shape the backend's own `constants/integrations.js`
 * mirrors, so a field added on one side is never missing on the other.
 *
 * @format
 */

export const INTEGRATION_META = {
  sms: {
    title: 'SMS Configuration',
    subtitle: 'Configure MSG91 for OTP and transactional SMS',
    provider: 'MSG91',
    icon: 'sms',
    notice:
      'Credentials are encrypted with AES-256 before storing in the database. Enter the approved MSG91 auth key, OTP template ID, and sender ID to update the configuration.',
    fields: [
      { key: 'authKey', label: 'Auth Key', required: true, placeholder: 'Enter MSG91 Auth Key', secret: true },
      {
        key: 'templateId',
        label: 'OTP Template ID',
        required: true,
        placeholder: 'Enter approved MSG91 OTP Template ID',
      },
      {
        key: 'senderId',
        label: 'Sender ID',
        required: true,
        placeholder: 'Enter 6-letter Sender ID (e.g., ECTZN)',
      },
    ],
  },
  email: {
    title: 'Email Configuration',
    subtitle: 'Configure SMTP for transactional emails',
    provider: 'SMTP',
    icon: 'email',
    notice: 'Credentials are encrypted with AES-256 before storing in the database. Enter all fields to update the configuration.',
    fields: [
      { key: 'host', label: 'SMTP Host', required: true, placeholder: 'e.g., smtp.gmail.com' },
      { key: 'port', label: 'Port', required: true, placeholder: 'e.g., 587' },
      { key: 'username', label: 'Username / Email', required: true, placeholder: 'e.g., noreply@ecitizen.gov.in' },
      {
        key: 'password',
        label: 'Password / App Password',
        required: true,
        placeholder: 'Enter email password or app password',
        secret: true,
      },
    ],
  },
  payment: {
    title: 'Payment Gateway Configuration',
    subtitle: 'Configure Razorpay for payment processing',
    provider: 'Razorpay',
    icon: 'payment',
    notice: 'Credentials are encrypted with AES-256 before storing in the database. Enter all fields to update the configuration.',
    /* Not wired into the live application-payment flow yet — see the field's
       own note in the page. Saved now so activation is a flag flip, not a
       second round of typing keys in, once that flow exists. */
    scaffoldNotice:
      "This integration is not yet connected to application payments — the fee is still recorded the way it is today. Saving credentials here gets Razorpay ready for when it is.",
    fields: [
      { key: 'keyId', label: 'Key ID', required: true, placeholder: 'Enter Razorpay Key ID (e.g., rzp_live_...)' },
      { key: 'keySecret', label: 'Key Secret', required: true, placeholder: 'Enter Razorpay Key Secret', secret: true },
      {
        key: 'webhookSecret',
        label: 'Webhook Secret',
        required: false,
        optionalLabel: '(optional, but strongly recommended)',
        placeholder: 'Paste the webhook secret from Razorpay',
        secret: true,
        hint:
          'Without this, payments only get confirmed when the customer’s app calls back — if they close the app right after paying, the order can get stuck as "pending" even though Razorpay captured the money. Set up the webhook below once payments go live to fix that.',
      },
    ],
    /* Shown once payments actually go live through this integration — the
       URL is real and already routed (routes/webhooks.routes.js), even
       though nothing calls it into the fee flow yet (see scaffoldNotice
       above). */
    webhookPath: '/webhooks/razorpay',
    webhookEvents: ['payment.captured', 'payment.failed'],
  },
  firebase: {
    title: 'Firebase Configuration',
    subtitle: 'Configure Firebase for push notifications, analytics & more',
    provider: 'Firebase',
    icon: 'firebase',
    notice:
      'All credentials are encrypted with AES-256 and sent securely to the mobile app after login. Get these from Firebase Console > Project Settings.',
    fields: [
      { key: 'apiKey', label: 'API Key', required: true, placeholder: 'Enter Firebase API Key', secret: true },
      { key: 'projectId', label: 'Project ID', required: true, placeholder: 'e.g., ecitizen-app' },
      { key: 'storageBucket', label: 'Storage Bucket', required: false, placeholder: 'e.g., ecitizen-app.appspot.com' },
      { key: 'messagingSenderId', label: 'Messaging Sender ID', required: false, placeholder: 'e.g., 123456789012' },
      { key: 'appId', label: 'App ID', required: true, placeholder: 'e.g., 1:123456789:android:abc123' },
    ],
    /* Its own card on the page, its own Save action, and never summarised
       back — see backend showInSummary: false on this one field. */
    pushCredential: {
      key: 'serviceAccountJson',
      label: 'Service Account JSON',
      required: true,
      multiline: true,
      placeholder:
        'Paste the full contents of the downloaded JSON key file, e.g.\n{"type": "service_account", "project_id": "...", ...}',
      notice:
        'This is a separate, more sensitive credential — the service account key that lets the backend actually send push notifications via Firebase Cloud Messaging. Get it from Firebase Console > Project Settings > Service Accounts > Generate new private key. It is AES-256 encrypted at rest and never sent to the mobile app.',
    },
  },
  aws: {
    title: 'AWS Configuration',
    subtitle: 'Configure Amazon S3 for encrypted document storage',
    provider: 'AWS S3',
    icon: 'aws',
    notice:
      'Credentials are encrypted with AES-256 before storing in the database. The bucket must already exist — this integration only ever writes and reads objects in it, never creates it.',
    /* Real, not a scaffold: switching this on genuinely moves where new
       documents go, not just where their credentials are stored — see
       backend storage.service.js's own note on why. Said plainly here so
       activating this is not treated as harmless the way an unwired
       integration would be. */
    scaffoldNotice:
      'Once active, every new document upload — agent onboarding, application documents, profile photos — is sealed and written to this bucket instead of local storage. Files already stored elsewhere stay exactly where they are and remain reachable; only new uploads move.',
    fields: [
      {
        key: 'accessKeyId',
        label: 'Access Key ID',
        required: true,
        placeholder: 'Enter AWS Access Key ID',
      },
      {
        key: 'secretAccessKey',
        label: 'Secret Access Key',
        required: true,
        placeholder: 'Enter AWS Secret Access Key',
        secret: true,
      },
      { key: 'region', label: 'Region', required: true, placeholder: 'e.g., ap-south-1' },
      { key: 'bucket', label: 'S3 Bucket Name', required: true, placeholder: 'e.g., ecitizen-documents' },
    ],
  },
};

export const INTEGRATION_ORDER = ['sms', 'email', 'payment', 'firebase', 'aws'];
