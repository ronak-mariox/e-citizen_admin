/** The sign-in and password-reset fields both accept an email address *or* a
    mobile number, and the backend resolves whichever it was handed. Keeping
    the rule here stops the two forms from drifting apart. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\+?[0-9]{10,15}$/;

export function isEmailOrMobile(value) {
  const trimmed = value.trim();

  // Drop the separators people type into phone numbers before testing, so
  // "+91 98765 43210" is not rejected for its spaces.
  const digitsOnly = trimmed.replace(/[\s-]/g, '');

  return EMAIL_PATTERN.test(trimmed) || MOBILE_PATTERN.test(digitsOnly);
}

export default { isEmailOrMobile };
