import { useEffect, useMemo, useRef, useState } from 'react';

import Icon from './Icon.jsx';
import { PriorityTag, StatusPill } from './StatusPill.jsx';
import AssignmentPanel from './AssignmentPanel.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import * as applicationsApi from '../../api/applications.js';
import { getErrorMessage } from '../../api/client.js';
import { useLiveRefresh } from '../../hooks/useLiveRefresh.js';
import { applicationStatus, priority } from '../../constants/statusTone.js';
import { rupees } from '../../utils/format.js';

/* One application, in full.

   The table hands over an id and this fetches the rest: the row deliberately
   carries no answers, no documents and no timeline, because they are the bulk
   of an application and nine columns cannot show them. So the detail is a
   second request rather than a bigger list.

   Mostly read-only, and that is not an omission. An admin cannot move an
   application through the workflow — that is an agent's queue, with its own
   rules about who may do what — so most of this screen answers "what is this,
   and where has it got to", which is the question the table cannot.

   Extension Requests is the one genuine exception: an Agent 2 asking for more
   time is asking the admin specifically, and there is nobody else's queue for
   that decision to live in — see ExtensionRequests below. */

const DATE_TIME = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

const DATE = { day: '2-digit', month: 'short', year: 'numeric' };

const stamp = (value, options = DATE_TIME) => {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', options);
};

/** What a status is called, reusing the console's one mapping of them. */
const statusLabel = (value) => applicationStatus(value).label;

/** An answer's value, whatever shape it arrived in. */
const answerText = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';

  const text = String(value ?? '').trim();

  return text || '—';
};

/** A label/value pair — the whole summary is these. */
function Fact({ label, children }) {
  return (
    <div className="appfact">
      <dt className="appfact__label">{label}</dt>
      <dd className="appfact__value">{children}</dd>
    </div>
  );
}

const EXTENSION_STATUS_TONE = { pending: 'amber', approved: 'green', rejected: 'red' };
const EXTENSION_STATUS_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

/**
 * Every ask Agent 2 has made for more time on this case, and — for the ones
 * still pending — the admin's own action on them.
 *
 * Approving edits the one thing an extension actually buys: `slaHours` on the
 * application itself (see backend computeSlaStatus, which reads it directly).
 * The days input opens pre-filled with what was asked, editable rather than
 * fixed — an admin granting three of the five days asked for is a normal
 * outcome, not an edge case to work around.
 */
function ExtensionRequests({ application, onUpdated }) {
  const requests = application.extensionRequests ?? [];

  // Which pending row has its Grant form open — one at a time, id or null.
  const [granting, setGranting] = useState(null);
  const [days, setDays] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  if (requests.length === 0) return null;

  const startGrant = (request) => {
    setActionError(null);
    setGranting(request.id);
    setDays(String(request.days));
  };

  const cancelGrant = () => {
    setGranting(null);
    setDays('');
  };

  async function submitGrant(request) {
    const parsedDays = Number(days);
    if (!Number.isInteger(parsedDays) || parsedDays < 1) {
      setActionError('Enter a whole number of days, at least 1.');
      return;
    }

    setBusyId(request.id);
    setActionError(null);

    try {
      const updated = await applicationsApi.approveExtensionRequest(application.id, request.id, {
        days: parsedDays,
      });
      onUpdated(updated);
      setGranting(null);
      setDays('');
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(request) {
    setBusyId(request.id);
    setActionError(null);

    try {
      const updated = await applicationsApi.rejectExtensionRequest(application.id, request.id);
      onUpdated(updated);
      setRejecting(null);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="card card--spaced">
      <div className="card__head">
        <div>
          <h2 className="card__title">Extension Requests</h2>
          <p className="card__subtitle">Asks from Agent 2 for more time on this case</p>
        </div>
      </div>

      {actionError && (
        <p className="notice notice--error" role="alert">
          {actionError}
        </p>
      )}

      <ul className="extreq__list">
        {requests.map((request) => (
          <li className="extreq" key={request.id}>
            <div className="extreq__head">
              <span className="extreq__body">
                <span className="extreq__title">
                  {request.requestedBy.name ?? 'An Agent 2'}
                  {request.requestedBy.employeeId ? ` · ${request.requestedBy.employeeId}` : ''}
                  {' asked for '}
                  {request.days} more day{request.days === 1 ? '' : 's'}
                </span>
                {request.reason && <span className="extreq__reason">{request.reason}</span>}
                <span className="extreq__meta">{stamp(request.requestedAt)}</span>
              </span>

              <StatusPill
                label={EXTENSION_STATUS_LABEL[request.status] ?? request.status}
                tone={EXTENSION_STATUS_TONE[request.status] ?? 'slate'}
              />
            </div>

            {request.status !== 'pending' && (
              <p className="extreq__resolution">
                {request.status === 'approved'
                  ? `Granted ${request.daysGranted} day${request.daysGranted === 1 ? '' : 's'}`
                  : 'No extra time granted'}
                {request.resolvedAt ? ` · ${stamp(request.resolvedAt)}` : ''}
                {request.resolutionNote ? ` — ${request.resolutionNote}` : ''}
              </p>
            )}

            {request.status === 'pending' && granting !== request.id && (
              <div className="extreq__actions">
                <button
                  className="btn btn--sm btn--primary"
                  type="button"
                  disabled={busyId === request.id}
                  onClick={() => startGrant(request)}
                >
                  Approve
                </button>
                <button
                  className="btn btn--sm"
                  type="button"
                  disabled={busyId === request.id}
                  onClick={() => setRejecting(request)}
                >
                  Reject
                </button>
              </div>
            )}

            {/* The place where the case's SLA is actually edited — opened by
                Approve rather than granting the instant it is clicked, since
                an admin adjusting the days first is a normal outcome. */}
            {granting === request.id && (
              <div className="extreq__grant">
                <label className="field2">
                  <span className="field2__label">Days to grant</span>
                  <input
                    className="field2__input"
                    type="number"
                    min="1"
                    max="365"
                    value={days}
                    onChange={(event) => setDays(event.target.value)}
                  />
                </label>

                <div className="extreq__actions">
                  <button className="btn btn--sm" type="button" onClick={cancelGrant}>
                    Cancel
                  </button>
                  <button
                    className="btn btn--sm btn--primary"
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => submitGrant(request)}
                  >
                    {busyId === request.id ? 'Granting…' : 'Grant Extension'}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {rejecting && (
        <ConfirmDialog
          title="Reject this extension request?"
          body={`${rejecting.requestedBy.name ?? 'The Agent 2'} will be told the request was rejected. No extra time is granted.`}
          confirmLabel="Yes, reject"
          tone="danger"
          busy={busyId === rejecting.id}
          onCancel={() => setRejecting(null)}
          onConfirm={() => confirmReject(rejecting)}
        />
      )}
    </section>
  );
}

export function ApplicationDetail({ application: row, onBack }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((token) => token + 1);

  // A live refetch keeps the application on screen, and keeps it if it fails.
  const quietReload = useRef(false);
  useLiveRefresh(() => {
    quietReload.current = true;
    reload();
  }, ['applications']);

  useEffect(() => {
    let cancelled = false;
    const quiet = quietReload.current;
    quietReload.current = false;

    /* Fetching is this screen synchronising itself with the API, which is what
       an effect is for; `cancelled` drops a response for a row the admin has
       already navigated away from. */
    if (!quiet) {
      setLoading(true);
      setLoadError(null);
    }

    applicationsApi
      .getApplication(row.id)
      .then((data) => {
        if (cancelled) return;
        setApplication(data);
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

  /* The answers as the citizen walked them — the admin's own field groups, in
     the order the form asked. Answers carry the section they belong to, so the
     grouping is the service's rather than something invented here. A service
     with no groups gets one unnamed block, which is what its form was. */
  const sections = useMemo(() => {
    const groups = [];

    for (const answer of application?.answers ?? []) {
      const name = answer.section?.trim() || 'Details';
      const existing = groups.find((group) => group.name === name);

      if (existing) existing.answers.push(answer);
      else groups.push({ name, answers: [answer] });
    }

    return groups;
  }, [application]);

  /* Newest first. The table is sorted by what moved last and an admin arriving
     from it is looking for the same thing — what just happened, not what
     happened first. */
  const timeline = useMemo(
    () => [...(application?.timeline ?? [])].reverse(),
    [application]
  );

  /* The row is already in hand, so the header draws immediately and only the
     body waits on the fetch — an admin who clicked a number sees that number
     rather than a blank screen with a spinner in the middle of it. */
  const shown = application ?? row;
  const tone = applicationStatus(shown.status);
  const urgency = priority(shown.priority);
  const fees = application?.fees;

  return (
    <>
      <div className="page__head">
        <div>
          <button className="btn page__back" type="button" onClick={onBack}>
            <Icon name="chevronLeft" size={14} />
            Back to applications
          </button>

          <h1 className="page__title">{shown.applicationNumber}</h1>
          <p className="page__subtitle">
            {shown.service?.name ?? '—'} · {shown.department?.name ?? '—'}
          </p>
        </div>

        <div className="page__actions">
          <StatusPill label={tone.label} tone={tone.tone} />
          <PriorityTag label={urgency.label} tone={urgency.tone} />
        </div>
      </div>

      {loadError && (
        <section className="card card--spaced">
          <div className="empty">
            <span className="empty__icon">
              <Icon name="alert" size={20} />
            </span>
            <p className="empty__title">Could not load this application</p>
            <p className="empty__text">{loadError}</p>
            <button className="btn btn--sm" type="button" onClick={reload}>
              <Icon name="refresh" size={13} />
              Try again
            </button>
          </div>
        </section>
      )}

      {loading && !application && !loadError && (
        <section className="card card--spaced">
          <div className="empty">
            <span className="empty__icon">
              <Icon name="refresh" size={20} />
            </span>
            <p className="empty__title">Loading the application…</p>
          </div>
        </section>
      )}

      {application && (
        <>
          <section className="card card--spaced">
            <div className="card__head">
              <div>
                <h2 className="card__title">Summary</h2>
                <p className="card__subtitle">
                  Who filed it, what for, and where it has got to
                </p>
              </div>
            </div>

            <dl className="appfacts">
              <Fact label="Citizen">
                {/* A citizen who has not filled in their profile has no name
                    anywhere, and the mobile is who they are. */}
                {application.citizen?.fullName ?? application.citizen?.mobile ?? '—'}
              </Fact>
              <Fact label="Mobile">{application.citizen?.mobile ?? '—'}</Fact>
              <Fact label="Service">{application.service?.name ?? '—'}</Fact>
              <Fact label="Department">{application.department?.name ?? '—'}</Fact>
              <Fact label="Reference">{application.referenceNumber ?? '—'}</Fact>
              <Fact label="Status">{statusLabel(application.status)}</Fact>

              <Fact label="Submitted">
                {application.status === 'draft'
                  ? 'Not submitted'
                  : stamp(application.submittedAt)}
              </Fact>
              <Fact label="Last updated">{stamp(application.updatedAt)}</Fact>
              <Fact label="Expected by">
                {application.expectedCompletionDate
                  ? stamp(application.expectedCompletionDate, DATE)
                  : 'Not stated'}
              </Fact>
              {/* Internal only — the SLA clock (slaHours, paused on
                  citizen-owed delays), unrelated to the citizen's own
                  promised date above. See computeSlaStatus, backend
                  application.service.js. */}
              <Fact label="SLA Remaining">
                <span className={application.sla?.isOverdue ? 'appfact__value--danger' : undefined}>
                  {application.sla?.remainingLabel ?? '—'}
                </span>
              </Fact>
            </dl>
          </section>

          {/* Approving/rejecting replaces the record in place rather than
              refetching, same as AssignmentPanel below — both calls already
              answer with the application as it now stands. */}
          <ExtensionRequests application={application} onUpdated={setApplication} />

          {/* Reassigning replaces the record in place rather than refetching:
              the assign call already answers with the application as it now
              stands, history included. */}
          <AssignmentPanel application={application} onAssigned={setApplication} />

          <section className="card card--spaced">
            <div className="card__head">
              <div>
                <h2 className="card__title">Fees</h2>
                <p className="card__subtitle">
                  {/* Frozen at submission so a reprice cannot change what this
                      citizen owes between the quote and the payment. */}
                  Quoted when this was filed, and unaffected by later pricing
                </p>
              </div>

              <StatusPill
                label={application.isPaid ? 'Paid' : 'Unpaid'}
                tone={application.isPaid ? 'green' : 'amber'}
              />
            </div>

            <dl className="appfacts">
              {/* Paise on the API, rupees here. */}
              <Fact label="Government fee">{rupees((fees?.govtFee ?? 0) / 100)}</Fact>
              <Fact label="Service charge">{rupees((fees?.serviceCharge ?? 0) / 100)}</Fact>
              <Fact label="Delivery">{rupees((fees?.deliveryCharge ?? 0) / 100)}</Fact>
              <Fact label={`GST (${(fees?.gstBasisPoints ?? 0) / 100}%)`}>
                {rupees((fees?.gstAmount ?? 0) / 100)}
              </Fact>
              <Fact label="Total">
                <strong>{rupees((fees?.totalAmount ?? 0) / 100)}</strong>
              </Fact>
            </dl>
          </section>

          <section className="card card--spaced">
            <div className="card__head">
              <div>
                <h2 className="card__title">What the citizen filled in</h2>
                <p className="card__subtitle">
                  The service&apos;s own form, in the order it asked
                </p>
              </div>
            </div>

            {sections.length === 0 && (
              <p className="appempty">
                This service asks no questions of its own — the department works from
                the citizen&apos;s profile and the documents listed on the service page.
              </p>
            )}

            {sections.map((section) => (
              <div className="appsection" key={section.name}>
                <h3 className="appsection__title">{section.name}</h3>

                <dl className="appfacts">
                  {section.answers.map((answer) => (
                    <Fact label={answer.label ?? answer.key} key={answer.key}>
                      {answerText(answer.value)}
                    </Fact>
                  ))}
                </dl>
              </div>
            ))}
          </section>

          <section className="card card--spaced">
            <div className="card__head">
              <div>
                <h2 className="card__title">Documents</h2>
                <p className="card__subtitle">
                  What the service asks for, and what has arrived
                </p>
              </div>
            </div>

            {application.documents?.length ? (
              <ul className="doc__list">
                {application.documents.map((document) => (
                  <li className="doc__row" key={document.id}>
                    <div className="doc__main">
                      <span className="doc__name">
                        <Icon name="shield" size={14} />
                        {document.label ?? document.key}
                      </span>
                      <span className="doc__meta">
                        {document.originalName ?? 'No file name recorded'}
                      </span>
                    </div>

                    {/* Two different facts, and the second one outranks the
                        first: a document can be marked pending review and still
                        have no bytes behind it, and "not uploaded" is what an
                        admin needs to see. */}
                    <span
                      className={
                        document.isUploaded
                          ? 'doc__status doc__status--pending'
                          : 'doc__status doc__status--missing'
                      }
                    >
                      {document.isUploaded ? statusLabel(document.status) : 'Not uploaded'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="appempty">No documents are attached to this application.</p>
            )}
          </section>

          <section className="card card--spaced">
            <div className="card__head">
              <div>
                <h2 className="card__title">History</h2>
                <p className="card__subtitle">
                  Every recorded step, most recent first
                </p>
              </div>
            </div>

            {timeline.length ? (
              <ol className="apptrail">
                {timeline.map((entry, index) => (
                  <li className="apptrail__row" key={`${entry.status}-${entry.at}-${index}`}>
                    <span className="apptrail__dot" aria-hidden="true" />

                    <div className="apptrail__body">
                      <p className="apptrail__title">{statusLabel(entry.status)}</p>
                      {entry.note && <p className="apptrail__note">{entry.note}</p>}
                    </div>

                    <span className="apptrail__when">{stamp(entry.at)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="appempty">Nothing has been recorded against this yet.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}

export default ApplicationDetail;
