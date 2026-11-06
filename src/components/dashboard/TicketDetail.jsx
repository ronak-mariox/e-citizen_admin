import { useEffect, useRef, useState } from 'react';

import Icon from './Icon.jsx';
import { PriorityTag, StatusPill } from './StatusPill.jsx';
import * as ticketsApi from '../../api/tickets.js';
import { getErrorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLiveRefresh } from '../../hooks/useLiveRefresh.js';
import { PRIORITY_TONE, TICKET_CATEGORY_LABEL, priority, ticketStatus } from '../../constants/statusTone.js';

/* One support ticket, worked end to end.

   Unlike ApplicationDetail this screen is mostly actions, because answering a
   ticket is the admin's own job rather than an agent's: the thread to reply on,
   and a Manage card for status, priority and owner. Both calls answer with the
   ticket as it now stands, so each replaces the record in place rather than
   refetching. */

const DATE_TIME = { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' };

const stamp = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', DATE_TIME);
};

function Fact({ label, children }) {
  return (
    <div className="appfact">
      <dt className="appfact__label">{label}</dt>
      <dd className="appfact__value">{children}</dd>
    </div>
  );
}

/**
 * Status, priority and owner.
 *
 * The status select offers only what the backend would accept from where the
 * ticket is now (`allowedStatuses`), plus the current status so the select can
 * show it. The note is optional and goes to the citizen with the change.
 */
function ManageCard({ ticket, onUpdated }) {
  const { user } = useAuth();
  const myId = user?.id ?? user?._id ?? null;

  const [assignees, setAssignees] = useState([]);
  const [status, setStatus] = useState(ticket.status);
  const [level, setLevel] = useState(ticket.priority);
  const [owner, setOwner] = useState(ticket.assignedTo?.id ?? '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    ticketsApi
      .listAssignees()
      .then((rows) => {
        if (!cancelled) setAssignees(rows);
      })
      .catch(() => {
        // The current owner is still shown below; only the choice is lost.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* A fresh ticket from the server resets the form to what is now true —
     unless a live refetch lands while the admin has a change half made, which
     would otherwise be thrown away. `basedOn` is the ticket the form started
     from; `justSaved` marks the update as this form's own save. */
  const basedOn = useRef(ticket);
  const justSaved = useRef(false);

  useEffect(() => {
    const was = basedOn.current;
    basedOn.current = ticket;

    const untouched =
      status === was.status && level === was.priority && owner === (was.assignedTo?.id ?? '') && !note;
    if (!untouched && !justSaved.current) return;
    justSaved.current = false;

    setStatus(ticket.status);
    setLevel(ticket.priority);
    setOwner(ticket.assignedTo?.id ?? '');
    setNote('');
    // Only a new ticket resets the form; the draft is read, not followed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]);

  const statusChanged = status !== ticket.status;
  const changes = {
    ...(statusChanged ? { status } : {}),
    ...(level !== ticket.priority ? { priority: level } : {}),
    ...(owner !== (ticket.assignedTo?.id ?? '') ? { assignedTo: owner || null } : {}),
  };
  const dirty = Object.keys(changes).length > 0;

  async function save(override) {
    const body = override ?? { ...changes, note: statusChanged ? note : undefined };

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await ticketsApi.updateTicket(ticket.id, body);
      justSaved.current = true;
      onUpdated(updated);
      setSaved(true);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  // Owners who are not in the list (deactivated since) still need a label.
  const ownerListed = !ticket.assignedTo || assignees.some((one) => one.id === ticket.assignedTo.id);

  return (
    <section className="card card--spaced">
      <div className="card__head">
        <div>
          <h2 className="card__title">Manage</h2>
          <p className="card__subtitle">Move the ticket on, set its urgency, or hand it to someone</p>
        </div>

        {myId && ticket.assignedTo?.id !== myId && (
          <button className="btn btn--sm" type="button" disabled={saving} onClick={() => save({ assignedTo: myId })}>
            <Icon name="check" size={13} />
            Assign to me
          </button>
        )}
      </div>

      <div className="ticket-manage">
        <label className="field2">
          <span className="field2__label">Status</span>
          <select className="field2__input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value={ticket.status}>{ticketStatus(ticket.status).label}</option>
            {(ticket.allowedStatuses ?? []).map((key) => (
              <option value={key} key={key}>
                {ticketStatus(key).label}
              </option>
            ))}
          </select>
        </label>

        <label className="field2">
          <span className="field2__label">Priority</span>
          <select className="field2__input" value={level} onChange={(event) => setLevel(event.target.value)}>
            {Object.entries(PRIORITY_TONE).map(([key, value]) => (
              <option value={key} key={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field2">
          <span className="field2__label">Assigned to</span>
          <select className="field2__input" value={owner} onChange={(event) => setOwner(event.target.value)}>
            <option value="">Unassigned</option>
            {!ownerListed && <option value={ticket.assignedTo.id}>{ticket.assignedTo.name}</option>}
            {assignees.map((one) => (
              <option value={one.id} key={one.id}>
                {one.name}
                {one.id === myId ? ' (you)' : ''}
              </option>
            ))}
          </select>
        </label>

        {statusChanged && (
          <label className="field2 field2--full">
            <span className="field2__label">Note to the citizen (optional)</span>
            <input
              className="field2__input"
              value={note}
              maxLength={300}
              placeholder={
                status === 'waiting_on_citizen'
                  ? 'What do you need from them?'
                  : 'Shown with the status change, e.g. "Refund issued to your bank"'
              }
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        )}
      </div>

      {error && (
        <p className="notice notice--error ticket__notice" role="alert">
          <Icon name="alert" size={15} />
          {error}
        </p>
      )}

      <div className="ticket__actions">
        {saved && !dirty && <span className="field2__hint">Saved</span>}
        <button className="btn btn--primary" type="button" disabled={!dirty || saving} onClick={() => save()}>
          <Icon name="save" size={14} />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}

/** The thread, the citizen's original message first, and the reply box. */
function Conversation({ ticket, onUpdated }) {
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const closed = ticket.status === 'closed';
  // On a closed ticket only an internal note can be written.
  const asNote = internal || closed;

  async function send(event) {
    event.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    setError(null);

    try {
      onUpdated(await ticketsApi.replyToTicket(ticket.id, { text, internal: asNote }));
      setText('');
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setSending(false);
    }
  }

  const citizenName = ticket.citizen?.fullName ?? ticket.citizen?.mobile ?? 'Citizen';

  return (
    <section className="card card--spaced">
      <div className="card__head">
        <div>
          <h2 className="card__title">Conversation</h2>
          <p className="card__subtitle">
            Replies reach the citizen in the app; internal notes are seen by admins only
          </p>
        </div>
      </div>

      <ol className="thread">
        <li className="thread__msg thread__msg--citizen">
          <p className="thread__meta">
            <strong>{citizenName}</strong> · {stamp(ticket.createdAt)}
          </p>
          <p className="thread__text">{ticket.description}</p>
        </li>

        {(ticket.messages ?? []).map((message) => {
          const variant = message.isInternal
            ? 'thread__msg--internal'
            : message.authorRole === 'citizen'
              ? 'thread__msg--citizen'
              : 'thread__msg--admin';

          return (
            <li className={`thread__msg ${variant}`} key={message.id}>
              <p className="thread__meta">
                <strong>{message.authorName ?? (message.authorRole === 'citizen' ? citizenName : 'Admin')}</strong>
                {message.isInternal && <span className="thread__badge">Internal note</span>} · {stamp(message.at)}
              </p>
              <p className="thread__text">{message.text}</p>
            </li>
          );
        })}
      </ol>

      <form className="thread__composer" onSubmit={send}>
        <label className="field2 field2--full">
          <span className="field2__label">{asNote ? 'Internal note' : 'Reply to the citizen'}</span>
          <textarea
            className="field2__input field2__input--area"
            rows={4}
            maxLength={2000}
            value={text}
            placeholder={asNote ? 'Visible to admins only' : 'Write a reply — the citizen is notified in the app'}
            onChange={(event) => setText(event.target.value)}
          />
        </label>

        {error && (
          <p className="notice notice--error ticket__notice" role="alert">
            <Icon name="alert" size={15} />
            {error}
          </p>
        )}

        <div className="ticket__actions">
          {closed ? (
            <span className="field2__hint">
              This ticket is closed. Reopen it from Manage to reply to the citizen.
            </span>
          ) : (
            <label className="ticket__toggle">
              <input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} />
              Internal note
            </label>
          )}

          <button className="btn btn--primary" type="submit" disabled={sending || !text.trim()}>
            <Icon name="send" size={14} />
            {sending ? 'Sending…' : asNote ? 'Add note' : 'Send reply'}
          </button>
        </div>
      </form>
    </section>
  );
}

export function TicketDetail({ ticket: row, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

  // A live refetch keeps the ticket on screen, and keeps it if the refetch fails.
  const quietReload = useRef(false);
  useLiveRefresh(() => {
    quietReload.current = true;
    reload();
  }, ['tickets']);

  useEffect(() => {
    let cancelled = false;
    const quiet = quietReload.current;
    quietReload.current = false;

    if (!quiet) {
      setLoading(true);
      setLoadError(null);
    }

    ticketsApi
      .getTicket(row.id)
      .then((data) => {
        if (cancelled) return;
        setTicket(data);
        setLoadError(null);
      })
      .catch((error) => {
        if (!cancelled && !quiet) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [row.id, reloadToken]);

  // The row draws the header while the full ticket loads; a deep link has only an id.
  const shown = ticket ?? row;
  const tone = shown.status ? ticketStatus(shown.status) : null;
  const urgency = shown.priority ? priority(shown.priority) : null;

  return (
    <>
      <div className="page__head">
        <div>
          <button className="btn page__back" type="button" onClick={onBack}>
            <Icon name="chevronLeft" size={14} />
            Back to tickets
          </button>

          <h1 className="page__title">{shown.ticketNumber ?? 'Support ticket'}</h1>
          <p className="page__subtitle">
            {shown.subject ?? ''}
            {shown.category ? ` · ${TICKET_CATEGORY_LABEL[shown.category] ?? shown.category}` : ''}
          </p>
        </div>

        <div className="page__actions">
          {tone && <StatusPill label={tone.label} tone={tone.tone} />}
          {urgency && <PriorityTag label={urgency.label} tone={urgency.tone} />}
        </div>
      </div>

      {loadError && (
        <section className="card card--spaced">
          <div className="empty">
            <span className="empty__icon">
              <Icon name="alert" size={20} />
            </span>
            <p className="empty__title">Could not load this ticket</p>
            <p className="empty__text">{loadError}</p>
            <button className="btn btn--sm" type="button" onClick={reload}>
              <Icon name="refresh" size={13} />
              Try again
            </button>
          </div>
        </section>
      )}

      {loading && !ticket && !loadError && (
        <section className="card card--spaced">
          <div className="empty">
            <span className="empty__icon">
              <Icon name="refresh" size={20} />
            </span>
            <p className="empty__title">Loading the ticket…</p>
          </div>
        </section>
      )}

      {ticket && (
        <>
          <section className="card card--spaced">
            <div className="card__head">
              <div>
                <h2 className="card__title">Summary</h2>
                <p className="card__subtitle">Who raised it, about what, and who has it</p>
              </div>
            </div>

            <dl className="appfacts">
              <Fact label="Citizen">{ticket.citizen?.fullName ?? ticket.citizen?.mobile ?? '—'}</Fact>
              <Fact label="Mobile">{ticket.citizen?.mobile ?? '—'}</Fact>
              <Fact label="Category">{TICKET_CATEGORY_LABEL[ticket.category] ?? ticket.category}</Fact>
              <Fact label="Assigned to">{ticket.assignedTo?.name ?? 'Unassigned'}</Fact>
              <Fact label="Raised">{stamp(ticket.createdAt)}</Fact>
              <Fact label="Last activity">{stamp(ticket.lastActivityAt)}</Fact>
              {ticket.resolvedAt && <Fact label="Resolved">{stamp(ticket.resolvedAt)}</Fact>}
              {ticket.closedAt && <Fact label="Closed">{stamp(ticket.closedAt)}</Fact>}
            </dl>
          </section>

          <ManageCard ticket={ticket} onUpdated={setTicket} />

          <Conversation ticket={ticket} onUpdated={setTicket} />

          <section className="card card--spaced">
            <div className="card__head">
              <div>
                <h2 className="card__title">History</h2>
                <p className="card__subtitle">Every status the ticket has been in, most recent first</p>
              </div>
            </div>

            <ol className="apptrail">
              {[...(ticket.history ?? [])].reverse().map((entry, index) => (
                <li className="apptrail__row" key={`${entry.status}-${entry.at}-${index}`}>
                  <span className="apptrail__dot" aria-hidden="true" />

                  <div className="apptrail__body">
                    <p className="apptrail__title">{ticketStatus(entry.status).label}</p>
                    <p className="apptrail__note">
                      {[entry.byName, entry.note].filter(Boolean).join(' — ') || '—'}
                    </p>
                  </div>

                  <span className="apptrail__when">{stamp(entry.at)}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </>
  );
}

export default TicketDetail;
