import { useEffect, useMemo, useState } from 'react';

import Icon from './Icon.jsx';
import { PriorityTag, StatusPill } from './StatusPill.jsx';
import * as applicationsApi from '../../api/applications.js';
import { getErrorMessage } from '../../api/client.js';
import { applicationStatus, priority } from '../../constants/statusTone.js';
import { rupees } from '../../utils/format.js';

/* One application, in full.

   The table hands over an id and this fetches the rest: the row deliberately
   carries no answers, no documents and no timeline, because they are the bulk
   of an application and nine columns cannot show them. So the detail is a
   second request rather than a bigger list.

   Read-only, and that is not an omission. An admin cannot move an application
   through the workflow — that is an agent's queue, with its own rules about who
   may do what — so a screen with Approve and Reject on it would be offering
   something the API refuses. What it does is answer "what is this, and where
   has it got to", which is the question the table cannot. */

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

export function ApplicationDetail({ application: row, onBack }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((token) => token + 1);

  useEffect(() => {
    let cancelled = false;

    /* Fetching is this screen synchronising itself with the API, which is what
       an effect is for; `cancelled` drops a response for a row the admin has
       already navigated away from. */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setLoading(true);
    setLoadError(null);

    applicationsApi
      .getApplication(row.id)
      .then((data) => {
        if (!cancelled) setApplication(data);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getErrorMessage(error));
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

              {/* Nobody until the queue hands it to an officer, which is the
                  normal state of a fresh application. */}
              <Fact label="Assigned to">
                {application.assignedAgent?.name ?? 'Unassigned'}
              </Fact>

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
            </dl>
          </section>

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
