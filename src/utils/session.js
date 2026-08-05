/**
 * Where the browser keeps the session.
 *
 * The access token is short lived and has to travel in an Authorization header,
 * so it is held in localStorage. The refresh token is deliberately NOT here —
 * the backend sets it as an httpOnly cookie, which no script can read, so an
 * XSS bug cannot walk off with a 30-day session.
 *
 * The cached user is only there to paint the shell on first render; every boot
 * revalidates it against /auth/me.
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    // a half-written or hand-edited entry should not break the whole app
    return null;
  }
}

export function saveSession({ accessToken, user }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
