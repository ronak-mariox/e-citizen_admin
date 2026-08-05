import { useId, useState } from 'react';
import { Link } from 'react-router-dom';

import arrowLeft from '../assets/icons/arrow-left.svg';
import keyIcon from '../assets/icons/key.svg';
import userIcon from '../assets/icons/user.svg';
import sendIcon from '../assets/icons/send.svg';
import { SUPPORT_PHONE } from '../constants/brand.js';

export function ForgotPasswordForm({ onSubmit }) {
  const fieldId = useId();

  const [employeeId, setEmployeeId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = employeeId.trim().length > 0 && !submitting;

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.({ employeeId: employeeId.trim() });
    } catch (error) {
      setFormError(error?.message || 'Unable to send the code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-pane">
      <Link className="auth-back" to="/login">
        <img src={arrowLeft} alt="" width="13.12" height="13.12" />
        Back to Login
      </Link>

      <header className="auth-pane__head">
        <div className="auth-icon-badge auth-icon-badge--amber">
          <img src={keyIcon} alt="" width="22.494" height="22.494" />
        </div>
        <h1 className="auth-pane__title">Forgot password?</h1>
        <p className="auth-pane__subtitle">
          Enter your Employee ID. We will send a one-time code to the mobile number on your
          staff record.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor={fieldId}>
            Employee ID
          </label>
          <div className="field__control">
            <img className="field__icon" src={userIcon} alt="" width="14.992" height="14.992" />
            <input
              id={fieldId}
              className="field__input"
              type="text"
              name="employeeId"
              autoComplete="username"
              placeholder="ECZ-AD-0001"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            />
          </div>
        </div>

        <button
          className="auth-submit"
          type="submit"
          disabled={!canSubmit}
          data-busy={submitting}
        >
          <img src={sendIcon} alt="" width="14.992" height="14.992" />
          {submitting ? 'Sending…' : 'Send OTP'}
        </button>

        {formError && (
          <p className="auth-alert" role="alert">
            {formError}
          </p>
        )}
      </form>

      <div className="info-note">
        <p className="info-note__title">Don&apos;t have access to that number?</p>
        <p className="info-note__text">
          An administrator&apos;s number can only be changed by another administrator. Contact
          the platform owner or IT helpdesk at <strong>{SUPPORT_PHONE}</strong> (toll-free).
        </p>
      </div>
    </section>
  );
}

export default ForgotPasswordForm;
