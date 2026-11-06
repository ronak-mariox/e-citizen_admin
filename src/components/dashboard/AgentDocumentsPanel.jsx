import { useCallback, useEffect, useState } from 'react';

import Icon from './Icon.jsx';
import StatusPill from './StatusPill.jsx';
import * as agentsApi from '../../api/agents.js';
import { agentVerification } from '../../constants/statusTone.js';
import { getErrorMessage } from '../../api/client.js';
import { assetUrl } from '../../utils/format.js';

/* Review what an agent handed in.

   Two gates stand between a new account and its first piece of work: the agent
   uploads what was asked for, and an admin passes it here. Until the second one
   is done their console holds them on the upload dialog and the API refuses
   their work routes outright — so this screen is not a formality, it is what
   lets someone start.

   Its own component rather than another section of AgentEditForm, for two
   reasons. It is not part of that form's save: each verdict is its own request
   and takes effect the moment it is clicked, so burying it inside a form with a
   Save button would suggest otherwise. And it owns a checklist that changes
   under it — every verdict returns the whole list back — which is state the
   edit form has no business holding. */

const STATUS_COPY = {
  verified: 'Verified',
  rejected: 'Rejected',
  pending: 'Awaiting review',
};

/* The headline above the rows — where this account stands, in one line.

   The pill beside it comes from the same statusTone map the roster column uses,
   so the badge an admin clicked on is the badge they land next to. Only the
   sentences are local: a column has room for two words and this has room to say
   what happens next. */
const OVERALL = {
  verified: {
    tone: 'ok',
    title: 'Documents verified',
    body: 'This agent can sign in and work normally.',
  },
  in_review: {
    tone: 'warn',
    title: 'Waiting for your review',
    body: 'Everything has been handed in. The agent cannot work until each document below is verified.',
  },
  rejected: {
    tone: 'bad',
    title: 'A document was rejected',
    body: 'The agent has been asked to upload a replacement. They cannot work until it is in and verified.',
  },
  not_submitted: {
    tone: 'warn',
    title: 'Documents outstanding',
    body: 'The agent has not handed everything in yet. Their console asks for the rest at their next sign-in.',
  },
};

export function AgentDocumentsPanel({ agent, onReviewed }) {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Which row is mid-request, so only that row's buttons go quiet rather than
  // the whole panel greying out on a four-row list.
  const [busyId, setBusyId] = useState(null);

  // The row whose reject box is open, and what has been typed into it. One at a
  // time: two half-written reasons on screen is two chances to send the wrong.
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  const agentId = agent._id;

  useEffect(() => {
    let cancelled = false;

    agentsApi
      .getAgentOnboarding(agentId)
      .then((data) => {
        if (!cancelled) setChecklist(data);
      })
      .catch((caught) => {
        if (!cancelled) setError(getErrorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const review = useCallback(
    async (documentId, status, why) => {
      setBusyId(documentId);
      setError(null);

      try {
        // The verdict returns the whole checklist, including the overall status
        // — verifying the last row is what flips this account to verified, and
        // that is a change to the header rather than to the row clicked.
        setChecklist(await agentsApi.reviewAgentDocument(agentId, documentId, {
          status,
          reason: why,
        }));
        setRejecting(null);
        setReason('');

        /* The roster is still mounted behind this screen holding the badge the
           admin clicked in on. Without this, verifying the last document and
           going straight back would show "Review Docs" against an agent who was
           just cleared — and the obvious next move, clicking in again to find
           out why, would show them the verified panel and no explanation. */
        onReviewed?.();
      } catch (caught) {
        setError(getErrorMessage(caught));
      } finally {
        setBusyId(null);
      }
    },
    [agentId, onReviewed],
  );

  if (loading) {
    return (
      <section className="card card--spaced">
        <p className="field2__hint">Loading documents…</p>
      </section>
    );
  }

  const rows = checklist?.requiredDocuments ?? [];
  const extras = checklist?.extras ?? [];
  const overall = OVERALL[checklist?.verificationStatus] ?? OVERALL.not_submitted;
  const badge = agentVerification(checklist?.verificationStatus);

  const renderRow = (row) => {
    const held = Boolean(row.documentId);
    const isRejecting = rejecting === row.documentId;
    const busy = busyId === row.documentId;

    return (
      <li className="doc__row" key={row.type}>
        <div className="doc__main">
          <span className="doc__name">
            {/* Once one is in, the row names the certificate that arrived
                rather than the requirement it satisfied. */}
            {held && row.variantLabel ? row.variantLabel : row.label}
          </span>

          <span className="doc__meta">
            {held
              ? `${row.originalName ?? 'Uploaded'}${
                  row.variantLabel ? ` · for ${row.label}` : ''
                }`
              : 'Not uploaded yet'}
          </span>

          {row.status === 'rejected' && row.rejectionReason && (
            <span className="doc__reason">Rejected — {row.rejectionReason}</span>
          )}
        </div>

        <span className={`doc__status doc__status--${held ? row.status : 'missing'}`}>
          {held ? STATUS_COPY[row.status] ?? row.status : 'Missing'}
        </span>

        <div className="doc__actions">
          {held && (
            <a
              className="btn btn--small"
              href={assetUrl(row.url)}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="eye" size={13} />
              View
            </a>
          )}

          {/* A verified document keeps its buttons: an admin who passed the
              wrong file needs a way back, and re-verifying an already verified
              one is a no-op rather than an error. */}
          {held && row.status !== 'verified' && (
            <button
              className="btn btn--small btn--primary"
              type="button"
              disabled={busy}
              onClick={() => review(row.documentId, 'verified')}
            >
              <Icon name={busy ? 'refresh' : 'check'} size={13} />
              Verify
            </button>
          )}

          {held && row.status !== 'rejected' && (
            <button
              className="btn btn--small btn--danger"
              type="button"
              disabled={busy}
              onClick={() => {
                setRejecting(isRejecting ? null : row.documentId);
                setReason('');
              }}
            >
              Reject
            </button>
          )}
        </div>

        {isRejecting && (
          <div className="doc__reject">
            <label className="field2 field2--full">
              <span className="field2__label">Why is it rejected?</span>
              <textarea
                className="field2__input field2__input--area"
                value={reason}
                maxLength={500}
                rows={2}
                placeholder="e.g. the scan is unreadable — please upload a clearer photo"
                onChange={(event) => setReason(event.target.value)}
              />
              <span className="field2__hint">
                Shown to the agent on their upload dialog, and it is all they are told — so say
                what would make the next attempt pass.
              </span>
            </label>

            <div className="doc__rejectActions">
              <button
                className="btn btn--small"
                type="button"
                onClick={() => setRejecting(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn--small btn--danger"
                type="button"
                // The API insists on three characters; matching it here means
                // the admin is stopped by a disabled button rather than a 422.
                disabled={busy || reason.trim().length < 3}
                onClick={() => review(row.documentId, 'rejected', reason.trim())}
              >
                Reject document
              </button>
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <section className="card card--spaced">
      <div className="card__head">
        <div>
          <h2 className="card__title">Documents</h2>
          <p className="card__subtitle">
            What {agent.fullName} was asked for at sign-in, and what they have handed in.
          </p>
        </div>
      </div>

      <p className={`doc__overall doc__overall--${overall.tone}`} role="status">
        <Icon name={overall.tone === 'ok' ? 'check' : 'alert'} size={15} />
        <span>
          <strong>
            {overall.title}
            <StatusPill label={badge.label} tone={badge.tone} />
          </strong>
          {overall.body}
        </span>
      </p>

      {error && (
        <p className="notice notice--error" role="alert">
          <Icon name="alert" size={15} />
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="field2__hint">
          No documents were asked for on this account, so there is nothing to verify.
        </p>
      ) : (
        <ul className="doc__list">{rows.map(renderRow)}</ul>
      )}

      {/* Documents the agent handed in that are no longer on their list —
          an admin narrowed the requirement afterwards. Kept visible rather than
          dropped: the file is still on the account and still theirs. */}
      {extras.length > 0 && (
        <>
          <p className="field2__label">No longer required</p>
          <ul className="doc__list">{extras.map(renderRow)}</ul>
        </>
      )}
    </section>
  );
}

export default AgentDocumentsPanel;
