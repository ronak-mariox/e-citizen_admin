import { client } from './client.js';

/**
 * Third-party integration credentials — SMS, Email, Payment, Firebase
 * (backend/src/routes/integrations.routes.js).
 *
 * Every call is scoped to one `type` (`sms` | `email` | `payment` |
 * `firebase`) in the path. Credentials never round-trip in full: a save
 * sends plaintext once and the backend answers with the same masked view
 * `getIntegration` returns — see integrationConfig.service.js's
 * `maskCredential`.
 */

/** The masked current configuration, plus isActive/isConfigured. */
export async function getIntegration(type) {
  const response = await client.get(`/admins/integrations/${type}`);

  return response.data.data.integration;
}

/**
 * Save (part of) an integration's credentials.
 *
 * Partial by design — Firebase's page sends its client keys and its
 * service-account key as two separate calls against the same integration,
 * neither of which should have to resend the other's fields.
 */
export async function updateIntegrationCredentials(type, fields) {
  const response = await client.patch(`/admins/integrations/${type}`, fields);

  return response.data.data.integration;
}

/** Switch an integration on or off. Refused on if a required field is
    still missing. */
export async function setIntegrationActive(type, isActive) {
  const response = await client.patch(`/admins/integrations/${type}/active`, { isActive });

  return response.data.data.integration;
}

/** A real send outside the login flow, so an admin can confirm the saved
    MSG91 credentials work before relying on them. */
export async function sendTestSms(mobile) {
  await client.post('/admins/integrations/sms/test', { mobile });
}

export default { getIntegration, updateIntegrationCredentials, setIntegrationActive, sendTestSms };
