/** Display helpers shared by the shell and the list screens. */

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
