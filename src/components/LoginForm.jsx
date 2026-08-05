import { useId, useState } from 'react';
import { Link } from 'react-router-dom';

import badgeFile from '../assets/icons/badge-file.svg';
import userIcon from '../assets/icons/user.svg';
import lockIcon from '../assets/icons/lock.svg';
import eyeIcon from '../assets/icons/eye.svg';
import eyeOffIcon from '../assets/icons/eye-off.svg';
import shieldCheck from '../assets/icons/shield-check.svg';
import { SUPPORT_EMAIL } from '../constants/brand.js';

const MIN_PASSWORD_LENGTH = 4;

/** Matches the admin row in backend/src/scripts/seed_agents.js. */
const SEEDED_ACCOUNT = { email: 'admin@company.com', password: 'admin@12345' };

export function LoginForm({ onSubmit }) {
  const emailFieldId = useId();
  const passwordFieldId = useId();

  const [email, setemail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};

    if (!email.trim()) {
      next.email = 'Email is required.';
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.({ email: email.trim(), password, remember });
    } catch (error) {
      // A field-tagged failure belongs beside the input it is about. Anything
      // else — network, blocked account, wrong console — is about the attempt
      // as a whole and stays in the banner.
      if (error?.field) setErrors({ [error.field]: error.message });
      else setFormError(error?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-pane">
      <header className="auth-pane__head auth-pane__head--login">
        <p className="auth-badge">
          <img src={badgeFile} alt="" width="13.12" height="13.12" />
          Administration Console — Privileged Access
        </p>
        <h1 className="auth-pane__title">Welcome back</h1>
        <p className="auth-pane__subtitle">
          Sign in with your administrator credentials to continue
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor={emailFieldId}>
            Email address
          </label>
          <div className="field__control">
            <img className="field__icon" src={userIcon} alt="" width="14.992" height="14.992" />
            <input
              id={emailFieldId}
              className="field__input"
              type="text"
              name="email"
              autoComplete="username"
              placeholder={SEEDED_ACCOUNT.email}
              value={email}
              onChange={(event) => setemail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${emailFieldId}-error` : undefined}
            />
          </div>
          {errors.email && (
            <p className="field__error" id={`${emailFieldId}-error`}>
              {errors.email}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={passwordFieldId}>
            Password
          </label>
          <div className="field__control">
            <img className="field__icon" src={lockIcon} alt="" width="14.992" height="14.992" />
            <input
              id={passwordFieldId}
              className="field__input field__input--with-action"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? `${passwordFieldId}-error` : undefined}
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
          {errors.password && (
            <p className="field__error" id={`${passwordFieldId}-error`}>
              {errors.password}
            </p>
          )}
        </div>

        <div className="auth-form__options">
          <label className="checkbox">
            <input
              className="checkbox__box"
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Remember me
          </label>
          <Link className="link-button" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <button
          className="auth-submit"
          type="submit"
          disabled={submitting}
          data-busy={submitting}
        >
          <img src={shieldCheck} alt="" width="14.992" height="14.992" />
          {submitting ? 'Signing In…' : 'Sign In Securely'}
        </button>

        {formError && (
          <p className="auth-alert" role="alert">
            {formError}
          </p>
        )}
      </form>

      <div className="demo-note">
        <p className="demo-note__title">Seeded admin</p>
        <p className="demo-note__row">
          Email: <code>{SEEDED_ACCOUNT.email}</code>
        </p>
        <p className="demo-note__row">
          Password: <code>{SEEDED_ACCOUNT.password}</code>
        </p>
      </div>

      <p className="auth-support">
        Having trouble? Contact IT support at <strong>{SUPPORT_EMAIL}</strong>
      </p>
    </section>
  );
}

export default LoginForm;
