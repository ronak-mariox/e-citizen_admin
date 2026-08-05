import axios from 'axios';

import { clearSession, getAccessToken, saveSession } from '../utils/session.js';

/**
 * One axios instance for the whole app.
 *
 * `baseURL` comes from VITE_API_BASE_URL in .env, so every call can be written
 * as a short path — axios joins the two:
 *
 *   client.post('/auth/login')  ->  http://localhost:5000/api/v1/auth/login
 *
 * `withCredentials` is what sends and accepts the backend's httpOnly
 * refresh-token cookie on these cross-origin calls.
 */
export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  withCredentials: true,
});

// Called when the session is gone for good, so the app can drop to /login.
// AuthContext registers the real handler.
let onSessionExpired = () => {};

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

client.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * A single in-flight refresh, shared by every request that hits a 401 at once.
 *
 * Without this, several parallel calls expiring together would each fire their
 * own refresh; the backend rotates the token every time, so all but one would
 * present an already-replaced token and fail.
 */
let refreshInFlight = null;

function refreshAccessToken() {
  refreshInFlight ??= client
    .post('/auth/refresh')
    .then((response) => {
      const { accessToken, user } = response.data.data;
      saveSession({ accessToken, user });
      return accessToken;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

// Endpoints allowed to answer 401 without it meaning "session over" — retrying
// these would be circular, and a rejected sign-in is not an expiry.
const NO_RETRY_PATHS = ['/auth/refresh', '/auth/login', '/auth/logout'];

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isExpired = error.response?.status === 401;
    const isRetryable = request && !NO_RETRY_PATHS.some((path) => request.url?.includes(path));

    if (!isExpired || !isRetryable || request._retried) {
      return Promise.reject(error);
    }

    // one attempt only, so a token the backend keeps rejecting cannot loop
    request._retried = true;

    try {
      const accessToken = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${accessToken}`;

      return await client(request);
    } catch (refreshError) {
      clearSession();
      onSessionExpired();

      return Promise.reject(refreshError);
    }
  }
);

/**
 * Pulls a readable message out of whatever axios threw.
 *
 * The backend answers every failure with the same shape:
 *   { success: false, statusCode, message, errors? }
 * so `message` is already written for a human. Validation failures also carry
 * an `errors` array of `{ field, message }`, and its first entry is more
 * specific than the "Validation failed" summary.
 */
export function getErrorMessage(error) {
  if (error.response) {
    const { message, errors } = error.response.data ?? {};

    return errors?.[0]?.message || message || 'Something went wrong. Please try again.';
  }

  if (error.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.';
  }

  return 'Cannot reach the server. Check that the backend is running.';
}

/**
 * Which input the API blamed, when it named one.
 *
 * A validation or sign-in failure carries an `errors` array of `{ field,
 * message }`, and a form that knows the field can mark that input instead of
 * showing one message under all of them. Null when the failure is about the
 * request as a whole — a network drop, a blocked account, the wrong console.
 */
export function getErrorField(error) {
  return error.response?.data?.errors?.[0]?.field ?? null;
}

export default client;
