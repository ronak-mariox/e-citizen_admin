import { useId, useState } from 'react';

import lockGreen from '../assets/icons/lock-green.svg';
import lockIcon from '../assets/icons/lock.svg';
import eyeIcon from '../assets/icons/eye.svg';
import eyeOffIcon from '../assets/icons/eye-off.svg';
import keyWhite from '../assets/icons/key-white.svg';

const MIN_PASSWORD_LENGTH = 8;

/* The designed checklist is static grey; each rule reports whether it is met so
   the dot can fill in as the admin types. */
function checkRules(password, confirm) {
  return [
    { id: 'length', label: `At least ${MIN_PASSWORD_LENGTH} characters`, met: password.length >= MIN_PASSWORD_LENGTH },
    {
      id: 'mix',
      label: 'Mix of letters and numbers',
      met: /[a-z]/i.test(password) && /\d/.test(password),
    },
    { id: 'match', label: 'Passwords match', met: password.length > 0 && password === confirm },
  ];
}

export function ResetPasswordForm({ onSubmit }) {
  const passwordFieldId = useId();
  const confirmFieldId = useId();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rules = checkRules(password, confirm);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const unmet = rules.find((rule) => !rule.met);

    if (unmet) {
      setFormError(`Password requirement not met: ${unmet.label.toLowerCase()}.`);
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.({ password });
    } catch (error) {
      setFormError(error?.message || 'Unable to reset the password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-pane">
      <header className="auth-pane__head">
        <div className="auth-icon-badge auth-icon-badge--green">
          <img src={lockGreen} alt="" width="22.494" height="22.494" />
        </div>
        <h1 className="auth-pane__title">Set new password</h1>
        <p className="auth-pane__subtitle">Choose a strong password to secure your account.</p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor={passwordFieldId}>
            New Password
          </label>
          <div className="field__control">
            <img className="field__icon" src={lockIcon} alt="" width="14.992" height="14.992" />
            <input
              id={passwordFieldId}
              className="field__input field__input--with-action"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="field__toggle"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <img
                src={showPassword ? eyeOffIcon : eyeIcon}
                alt=""
                width="14.992"
                height="14.992"
              />
            </button>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor={confirmFieldId}>
            Confirm Password
          </label>
          <div className="field__control">
            <img className="field__icon" src={lockIcon} alt="" width="14.992" height="14.992" />
            <input
              id={confirmFieldId}
              className="field__input"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
        </div>

        <ul className="password-rules">
          {rules.map((rule) => (
            <li
              className={rule.met ? 'password-rule password-rule--met' : 'password-rule'}
              key={rule.id}
            >
              <span className="password-rule__dot" />
              {rule.label}
            </li>
          ))}
        </ul>

        <button className="auth-submit" type="submit" disabled={submitting} data-busy={submitting}>
          <img src={keyWhite} alt="" width="14.992" height="14.992" />
          {submitting ? 'Resetting…' : 'Reset Password'}
        </button>

        {formError && (
          <p className="auth-alert" role="alert">
            {formError}
          </p>
        )}
      </form>
    </section>
  );
}

export default ResetPasswordForm;
