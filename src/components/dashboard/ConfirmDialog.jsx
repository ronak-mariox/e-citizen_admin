import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import Icon from './Icon.jsx';

/**
 * A yes/no confirmation for an action that cannot be walked back.
 *
 * Generic on purpose — an admin console has a dozen of these (delete a
 * department, suspend an agent, reverse a payment) and they differ only in
 * wording and colour.
 *
 * Portalled to the body: below 900px the sidebar is a transformed drawer, and a
 * transform makes its subtree the containing block for `position: fixed` — an
 * overlay rendered inside it would be trapped in the 254px rail rather than
 * covering the page.
 */
export function ConfirmDialog({
  title,
  body,
  note,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onCancel,
  onConfirm,
}) {
  const confirmRef = useRef(null);

  // Escape closes it, and focus starts on the confirm button so the whole
  // dialog is reachable from the keyboard rather than only from a mouse.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };

    document.addEventListener('keydown', onKeyDown);
    confirmRef.current?.focus();

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel]);

  return createPortal(
    <div
      className="modal"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        className="modal__card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        onClick={(event) => event.stopPropagation()}
      >
        <span className={`modal__badge modal__badge--${tone}`}>
          <Icon name={tone === 'danger' ? 'alert' : 'check'} size={18} />
        </span>

        <h2 className="modal__title" id="confirm-title">
          {title}
        </h2>
        <p className="modal__body" id="confirm-body">
          {body}
        </p>

        {note && <p className="modal__note">{note}</p>}

        <div className="modal__actions">
          <button className="btn" type="button" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={tone === 'danger' ? 'btn btn--destructive' : 'btn btn--primary'}
            type="button"
            ref={confirmRef}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDialog;
