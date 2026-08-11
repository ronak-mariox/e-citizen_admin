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
