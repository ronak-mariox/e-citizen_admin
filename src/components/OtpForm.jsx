import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import arrowLeft from '../assets/icons/arrow-left.svg';
import smartphone from '../assets/icons/smartphone.svg';
import checkIcon from '../assets/icons/check.svg';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const emptyOtp = () => Array(OTP_LENGTH).fill('');

export function OtpForm({ destination, devOtp, onSubmit, onResend }) {
  const fieldId = useId();
  const inputRefs = useRef([]);

  const [digits, setDigits] = useState(emptyOtp);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Only ever set outside production, where the backend returns the code it
  // generated because no SMS gateway is wired up yet.
  const [hint, setHint] = useState(devOtp);

  const code = digits.join('');
  const canSubmit = code.length === OTP_LENGTH && !submitting;

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  function focusBox(index) {
    inputRefs.current[index]?.focus();
  }

  function writeDigits(startIndex, characters) {
    const next = [...digits];
    let cursor = startIndex;

    for (const character of characters) {
      if (cursor >= OTP_LENGTH) {
        break;
      }
      next[cursor] = character;
      cursor += 1;
    }

    setDigits(next);
    focusBox(Math.min(cursor, OTP_LENGTH - 1));
  }

  function handleChange(index, value) {
    const characters = value.replace(/\D/g, '');

    if (!characters) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    setFormError('');
    writeDigits(index, characters);
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      focusBox(index - 1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(index, event) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');

    if (!pasted) {
      return;
    }

    event.preventDefault();
    setFormError('');
    writeDigits(index, pasted);
  }

  async function handleResend() {
    setFormError('');
    setDigits(emptyOtp());
    focusBox(0);

    try {
      // the new code replaces the old one, so the old hint must not linger
      const nextOtp = await onResend?.();
      setHint(nextOtp ?? '');
      setSecondsLeft(RESEND_SECONDS);
    } catch (error) {
      setFormError(error?.message || 'Unable to resend the code. Please try again.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.({ code });
    } catch (error) {
      setFormError(error?.message || 'That code did not work. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-pane">
      <Link className="auth-back" to="/forgot-password">
        <img src={arrowLeft} alt="" width="13.12" height="13.12" />
        Back
      </Link>

      <header className="auth-pane__head">
        <div className="auth-icon-badge auth-icon-badge--indigo">
          <img src={smartphone} alt="" width="22.494" height="22.494" />
        </div>
        <h1 className="auth-pane__title">Enter OTP</h1>
        <p className="auth-pane__subtitle">
          A 6-digit code was sent to{' '}
          <strong>{destination || 'the mobile number on your staff record'}</strong>.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <span className="field__label" id={`${fieldId}-label`}>
            6-Digit OTP
          </span>
          <div className="otp-inputs" role="group" aria-labelledby={`${fieldId}-label`}>
            {digits.map((digit, index) => (
              <input
                // Positional boxes in a fixed-length list — the index is the identity.
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                className="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={OTP_LENGTH}
                aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                value={digit}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={(event) => handlePaste(index, event)}
              />
            ))}
          </div>
        </div>

        {secondsLeft > 0 ? (
          <p className="otp-resend">
            Resend OTP in <strong>{secondsLeft}s</strong>
          </p>
        ) : (
          <p className="otp-resend">
            <button className="link-button" type="button" onClick={handleResend}>
              Resend OTP
            </button>
          </p>
        )}

        <button
          className="auth-submit"
          type="submit"
          disabled={!canSubmit}
          data-busy={submitting}
        >
          <img src={checkIcon} alt="" width="14.992" height="14.992" />
          {submitting ? 'Verifying…' : 'Verify OTP'}
        </button>

        {formError && (
          <p className="auth-alert" role="alert">
            {formError}
          </p>
        )}
      </form>

      {hint && (
        <div className="hint-note">
          <p className="hint-note__text">
            <strong>Dev hint:</strong> the OTP is <code>{hint}</code> — shown because no SMS
            gateway is connected yet.
          </p>
        </div>
      )}
    </section>
  );
}

export default OtpForm;
