import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import Icon from './Icon.jsx';
import * as walletApi from '../../api/wallet.js';
import { getErrorMessage } from '../../api/client.js';
import { PAYMENT_METHODS, PAYOUT_PURPOSES } from '../../constants/wallet.js';
import { rupees } from '../../utils/format.js';

/**
 * The admin's split of one application's money.
 *
 * Shows what came in (the citizen's fee and any additional payment), what has
 * already gone to Agent 2, and the default split — the department fee plus the
 * additional payments go to Agent 2, the service charge and GST stay with the
 * company. The amount opens at that default and can be changed; it can never
 * exceed what is left of what was collected (the backend refuses it too).
 *
 * Portalled to the body, like ConfirmDialog, so the sidebar drawer's transform
 * cannot trap it.
 */
/* Paid so far for one purpose. Payouts from before purposes existed were all
   for the service, as the backend defaults them. */
const paidFor = (payouts, purpose) =>
  (payouts ?? []).filter((one) => (one.purpose ?? 'service') === purpose).reduce((sum, one) => sum + one.amount, 0);

export function PayoutDialog({ row, onCancel, onPaid }) {
  const money = row.money;

  /* Agent 2 sees the service share and the additional payment on separate
     lines, so each payout says which it is. The dialog opens on whichever is
     still unpaid, at what is left of it, and switching resets the amount. */
  /* Once Agent 2 has been paid the application is settled, and all that can
     be owed is an additional payment the citizen made after it — which the
     backend's `suggested` already is. */
  const settled = (row.payouts?.length ?? 0) > 0;
  const owed = settled
    ? { service: 0, additional: money.suggested }
    : {
        service: money.fee > 0 ? Math.max(0, (row.fees.govtFee ?? 0) - paidFor(row.payouts, 'service')) : 0,
        additional: Math.max(0, money.extrasPaid - paidFor(row.payouts, 'additional')),
      };
  const defaultFor = (one) => Math.min(owed[one], money.available) || money.available;

  const [purpose, setPurpose] = useState(owed.service > 0 || owed.additional === 0 ? 'service' : 'additional');
  const [amount, setAmount] = useState(String(defaultFor(purpose) / 100));
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel]);

  const paise = Math.round(Number(amount) * 100);
  const valid = Number.isFinite(paise) && paise > 0 && paise <= money.available;
  const companyKeeps = money.available - (valid ? paise : 0);

  async function submit(event) {
    event.preventDefault();
    if (!valid) return;

    setBusy(true);
    setError(null);
    try {
      onPaid(await walletApi.releasePayout(row.id, { amount: paise, purpose, method, reference, note }));
    } catch (failure) {
      setError(getErrorMessage(failure));
      setBusy(false);
    }
  }

  return createPortal(
    <div className="modal" role="presentation" onClick={() => !busy && onCancel()}>
      <form
        className="modal__card payout"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payout-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <span className="modal__badge modal__badge--primary">
          <Icon name="settlements" size={18} />
        </span>

        <h2 className="modal__title" id="payout-title">
          Pay Agent 2 — {row.applicationNumber}
        </h2>
        <p className="modal__body">
          {row.agent2?.name ?? 'Agent 2'}
          {row.agent2?.employeeId ? ` (${row.agent2.employeeId})` : ''} is paid from the company wallet.
          Agent 1 is not paid.
        </p>

        <dl className="payout__facts">
          <div>
            <dt>Collected from the citizen</dt>
            <dd>{rupees(money.collected / 100)}</dd>
          </div>
          <div>
            <dt>— of which department fee</dt>
            <dd>{rupees((row.fees.govtFee ?? 0) / 100)}</dd>
          </div>
          <div>
            <dt>— of which additional payments</dt>
            <dd>{rupees(money.extrasPaid / 100)}</dd>
          </div>
          <div>
            <dt>Already paid to Agent 2 — service</dt>
            <dd>{rupees(paidFor(row.payouts, 'service') / 100)}</dd>
          </div>
          <div>
            <dt>Already paid to Agent 2 — additional</dt>
            <dd>{rupees(paidFor(row.payouts, 'additional') / 100)}</dd>
          </div>
          <div className="payout__facts-sum">
            <dt>Default share for Agent 2</dt>
            <dd>{rupees(money.suggested / 100)}</dd>
          </div>
        </dl>

        <div className="payout__fields">
          <label className="field2">
            <span className="field2__label">Paying for</span>
            <select
              className="field2__input"
              value={purpose}
              onChange={(event) => {
                setPurpose(event.target.value);
                setAmount(String(defaultFor(event.target.value) / 100));
              }}
            >
              {PAYOUT_PURPOSES.map((one) => (
                <option value={one.value} key={one.value}>
                  {one.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field2">
            <span className="field2__label">Amount to pay (₹)</span>
            <input
              className="field2__input"
              type="number"
              min="0.01"
              step="0.01"
              max={money.available / 100}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
            <span className={valid ? 'field2__hint' : 'field2__hint field2__hint--error'}>
              {valid
                ? `The company keeps ${rupees(companyKeeps / 100)} of what is left on this application.`
                : `Enter up to ${rupees(money.available / 100)} — what is left of what was collected.`}
            </span>
          </label>

          <label className="field2">
            <span className="field2__label">Paid by</span>
            <select className="field2__input" value={method} onChange={(event) => setMethod(event.target.value)}>
              {PAYMENT_METHODS.map((one) => (
                <option value={one.value} key={one.value}>
                  {one.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field2">
            <span className="field2__label">Reference (UTR / cheque no.)</span>
            <input
              className="field2__input"
              value={reference}
              maxLength={120}
              onChange={(event) => setReference(event.target.value)}
            />
          </label>

          <label className="field2 field2--full">
            <span className="field2__label">Note (optional)</span>
            <input className="field2__input" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} />
          </label>
        </div>

        <p className="field2__hint">
          Paying settles this application: it moves to Payout history as Paid, even if you pay less than the
          default share.
        </p>

        {error && (
          <p className="notice notice--error" role="alert">
            <Icon name="alert" size={15} />
            {error}
          </p>
        )}

        <div className="modal__actions">
          <button className="btn" type="button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--primary" type="submit" disabled={busy || !valid}>
            {busy ? 'Paying…' : `Pay ${valid ? rupees(paise / 100) : ''}`}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default PayoutDialog;
