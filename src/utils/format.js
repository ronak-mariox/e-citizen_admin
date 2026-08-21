/** Display helpers shared by the shell and the list screens. */

/**
 * What to call the signed-in user on screen.
 *
 * `fullName` is optional on models/admin.js, and the seeded account is created
 * with an email and nothing else — so a console that only read `fullName` would
 * greet a real person as "Administrator". The email local part is a poor name
 * but a real identifier, and it is still better than a job title shared by
 * everyone who can sign in here.
 */
export function displayName(user, fallback = 'Administrator') {
  const name = user?.fullName?.trim();

  if (name) return name;

  const local = user?.email?.split('@')[0];

  if (local) {
    // "priya.sharma" / "priya_sharma" -> "Priya Sharma"
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(' ');
  }

  return fallback;
}

/** First letters of the first two words — "System Administrator" -> "SA". */
export function initialsOf(name, fallback = 'AD') {
  const trimmed = name?.trim();

  if (!trimmed) return fallback;

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/** Rupees, no decimals — every amount in the console is a whole rupee. */
export function rupees(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

/** Plain thousands separators, Indian grouping. */
export function count(value) {
  return new Intl.NumberFormat('en-IN').format(value ?? 0);
}

/**
 * An uploaded file path -> a URL the browser can request.
 *
 * The API stores paths relative to its own origin (`/uploads/agent-documents/…`),
 * so moving the API to another host does not invalidate every stored row. That
 * leaves the panel to rejoin the two, and the only origin it knows is inside
 * VITE_API_BASE_URL — which carries the /api/v1 prefix that these files sit
 * outside of, hence the trim.
 *
 * The same helper the agent consoles carry (their utils/format.js); kept in
 * step rather than shared, because these are three separately deployed apps.
 */
export function assetUrl(storedPath) {
  if (!storedPath) return '';
  if (/^https?:/.test(storedPath)) return storedPath;

  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  const origin = base.replace(/\/api\/v\d+\/?$/, '').replace(/\/+$/, '');

  return origin + storedPath;
}
