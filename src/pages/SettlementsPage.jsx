import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import PayoutDialog from '../components/dashboard/PayoutDialog.jsx';
import StatusPill from '../components/dashboard/StatusPill.jsx';
import * as walletApi from '../api/wallet.js';
import { getErrorMessage } from '../api/client.js';
import { PAYMENT_METHOD_LABEL } from '../constants/wallet.js';
import { rupees } from '../utils/format.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';

/* Settlements — the admin's split of the company wallet.

   Every citizen payment lands in the company wallet. Each application's
   Agent 2 is owed their share — the department fee they file with, plus any
   additional payment the citizen made at their request — and is paid from here.
   The service charge and GST stay with the company. Agent 1 is never paid.

   Two lists: what is still owed (with the Pay action), and what has been paid.
   Paying settles the application — it leaves Payouts due for Payout history,
   marked Paid, and only comes back if the citizen pays in more afterwards. */

const PAGE_SIZE = 20;
const DATE = { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' };
const stamp = (value) => (value ? new Date(value).toLocaleString('en-IN', DATE) : '—');
const money = (paise) => rupees((paise ?? 0) / 100);

const TABS = [
  { key: 'due', label: 'Payouts due' },
  { key: 'history', label: 'Payout history' },
];

const DUE_COLUMNS = '1.2fr 1.1fr 0.9fr 0.9fr 0.9fr 0.8fr';
const HISTORY_COLUMNS = '1fr 1.1fr 1.1fr 0.8fr 0.8fr 1fr 0.9fr 0.7fr';

export function SettlementsPage() {
  const [tab, setTab] = useState('due');
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [paying, setPaying] = useState(null);
  const [paidNotice, setPaidNotice] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

  /* Live refetches (useLiveRefresh) run quietly: the rows stay up while they
     load, and a failed one keeps them rather than swapping in an error. */
  const quietReload = useRef(false);
  useLiveRefresh(() => {
    quietReload.current = true;
    reload();
  }, ['wallet', 'applications']);
  const [params, setParams] = useSearchParams();
  const linkedId = params.get('applicationId');

  /* A "Pay ... their share" notification links here with `?applicationId=`.
     The application's money is fetched and its Pay dialog opened straight
     away; one already paid in full says so instead. The param is cleared once
     answered, so Back or a reload does not open it again — and only then, or
     clearing it would cancel the fetch it started. Keyed on the id rather than
     run once, so a notification clicked while already on this page works too. */
  useEffect(() => {
    if (!linkedId) return undefined;

    let cancelled = false;
    const clearLink = () =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete('applicationId');
          return next;
        },
        { replace: true }
      );

    walletApi
      .getApplicationMoney(linkedId)
      .then((row) => {
        if (cancelled) return;
        if (row.agent2 && row.money?.suggested > 0) {
          setPaying(row);
        } else {
          setPaidNotice(`Nothing is owed to Agent 2 on ${row.applicationNumber} right now.`);
        }
        clearLink();
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(getErrorMessage(error));
        clearLink();
      });

    return () => {
      cancelled = true;
    };
  }, [linkedId, setParams]);

  useEffect(() => {
    let cancelled = false;
    const quiet = quietReload.current;
    quietReload.current = false;

    if (!quiet) {
      setLoading(true);
      setLoadError(null);
    }

    Promise.all([
      walletApi.getWallet(),
      tab === 'due'
        ? walletApi.listPayoutsDue({ page, limit: PAGE_SIZE })
        : walletApi.listPayouts({ page, limit: PAGE_SIZE }),
    ])
      .then(([summary, rows]) => {
        if (cancelled) return;
        setLoadError(null);
        setWallet(summary);
        setData(rows);
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
  }, [tab, page, reloadToken]);

  const rows = (tab === 'due' ? data?.applications : data?.payouts) ?? [];
  const shownRows = data && (tab === 'due' ? 'applications' in data : 'payouts' in data) ? rows : [];

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Settlements</h1>
            <p className="page__subtitle">
              Pay each Agent 2 their share of what citizens paid into the company wallet
            </p>
          </div>

          <div className="page__actions">
            <button className="btn" type="button" onClick={reload} disabled={loading}>
              <Icon name="refresh" size={14} />
              Refresh
            </button>
          </div>
        </div>

        <div className="stat-grid">
          <StatCard icon="wallet" accent="#0052cc" value={wallet ? money(wallet.balance) : '—'} label="Company wallet" hint="Available to pay out" />
          <StatCard icon="clock" accent="#fe9a00" value={wallet ? String(wallet.payoutsDue) : '—'} label="Payouts due" hint="Applications owing Agent 2" />
          <StatCard icon="settlements" accent="#fb2c36" value={wallet ? money(wallet.payoutsDueAmount) : '—'} label="Owed to Agent 2" hint="By the default split" />
          <StatCard icon="check" accent="#00a63e" value={wallet ? money(wallet.totalDebited) : '—'} label="Paid out so far" hint="All time" />
        </div>

        {paidNotice && (
          <p className="notice settle__notice" role="status">
            <Icon name="check" size={15} />
            {paidNotice}
          </p>
        )}

        <section className="toolbar settle__toolbar" aria-label="Settlement lists">
          <div className="segmented" role="group" aria-label="List">
            {TABS.map((one) => (
              <button
                className={tab === one.key ? 'segmented__button segmented__button--active' : 'segmented__button'}
                type="button"
                key={one.key}
                aria-pressed={tab === one.key}
                onClick={() => {
                  setTab(one.key);
                  setPage(1);
                  setData(null);
                }}
              >
                {one.label}
              </button>
            ))}
          </div>
        </section>

        <section className="table-shell" aria-label={tab === 'due' ? 'Payouts due' : 'Payout history'}>
          <div className="table__overflow">
            <div className="table" role="table">
              {tab === 'due' ? (
                <div className="table__head" role="row" style={{ gridTemplateColumns: DUE_COLUMNS }}>
                  <div role="columnheader">Application</div>
                  <div role="columnheader">Agent 2</div>
                  <div role="columnheader" className="table__cell table__cell--end">Collected</div>
                  <div role="columnheader" className="table__cell table__cell--end">Paid out</div>
                  <div role="columnheader" className="table__cell table__cell--end">Owed to Agent 2</div>
                  <div role="columnheader" className="table__cell table__cell--end">Action</div>
                </div>
              ) : (
                <div className="table__head" role="row" style={{ gridTemplateColumns: HISTORY_COLUMNS }}>
                  <div role="columnheader">Paid on</div>
                  <div role="columnheader">Application</div>
                  <div role="columnheader">Agent 2</div>
                  <div role="columnheader" className="table__cell table__cell--end">Amount</div>
                  <div role="columnheader">Method</div>
                  <div role="columnheader">Reference</div>
                  <div role="columnheader">Paid by</div>
                  <div role="columnheader">Status</div>
                </div>
              )}

              {tab === 'due' &&
                shownRows.map((row) => (
                  <div className="table__row" role="row" key={row.id} style={{ gridTemplateColumns: DUE_COLUMNS }}>
                    <div className="table__cell" role="cell">
                      <span className="person__body">
                        <span className="person__name">{row.applicationNumber}</span>
                        <span className="person__meta table__truncate">{row.serviceName ?? '—'}</span>
                      </span>
                    </div>
                    <div className="table__cell" role="cell">
                      <span className="person__body">
                        <span className="person__name">{row.agent2?.name ?? '—'}</span>
                        <span className="person__meta">{row.agent2?.employeeId ?? ''}</span>
                      </span>
                    </div>
                    <div className="table__cell table__cell--end" role="cell">{money(row.money.collected)}</div>
                    <div className="table__cell table__cell--end table__muted" role="cell">{money(row.money.paidOut)}</div>
                    <div className="table__cell table__cell--end" role="cell">
                      <strong>{money(row.money.suggested)}</strong>
                    </div>
                    <div className="table__cell table__cell--end" role="cell">
                      <button
                        className="btn btn--primary btn--sm"
                        type="button"
                        onClick={() => {
                          setPaidNotice(null);
                          setPaying(row);
                        }}
                      >
                        Pay
                      </button>
                    </div>
                  </div>
                ))}

              {tab === 'history' &&
                shownRows.map((row) => (
                  <div className="table__row" role="row" key={row.id} style={{ gridTemplateColumns: HISTORY_COLUMNS }}>
                    <div className="table__cell table__muted" role="cell">{stamp(row.at)}</div>
                    <div className="table__cell" role="cell">{row.applicationNumber ?? '—'}</div>
                    <div className="table__cell" role="cell">{row.agentName ?? '—'}</div>
                    <div className="table__cell table__cell--end" role="cell">
                      <strong>{money(row.amount)}</strong>
                    </div>
                    <div className="table__cell table__muted" role="cell">{PAYMENT_METHOD_LABEL[row.method] ?? '—'}</div>
                    <div className="table__cell table__muted table__truncate" role="cell">{row.reference ?? '—'}</div>
                    <div className="table__cell table__muted table__truncate" role="cell">{row.actorName ?? '—'}</div>
                    <div className="table__cell" role="cell">
                      <StatusPill label="Paid" tone="green" />
                    </div>
                  </div>
                ))}

              {loading && shownRows.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="refresh" size={20} />
                  </span>
                  <p className="empty__title">Loading…</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="alert" size={20} />
                  </span>
                  <p className="empty__title">Could not load settlements</p>
                  <p className="empty__text">{loadError}</p>
                  <button className="btn btn--sm" type="button" onClick={reload}>
                    <Icon name="refresh" size={13} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && shownRows.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="settlements" size={20} />
                  </span>
                  <p className="empty__title">{tab === 'due' ? 'Nothing owed to Agent 2' : 'No payouts yet'}</p>
                  <p className="empty__text">
                    {tab === 'due'
                      ? 'An application appears here once the citizen has paid and an Agent 2 holds it.'
                      : 'Payouts appear here once you pay an Agent 2 from Payouts due.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <TableFooter
            shown={shownRows.length}
            total={data?.pagination?.total ?? shownRows.length}
            noun={tab === 'due' ? 'applications' : 'payouts'}
            page={data?.pagination?.page ?? 1}
            totalPages={data?.pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </section>
      </main>

      {paying && (
        <PayoutDialog
          row={paying}
          onCancel={() => setPaying(null)}
          onPaid={(updated) => {
            const last = updated.payouts[updated.payouts.length - 1];
            setPaying(null);
            setPaidNotice(
              `Paid ${money(last?.amount)} to ${updated.agent2?.name ?? 'Agent 2'} for ${updated.applicationNumber} — settled and moved to Payout history.`
            );
            reload();
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default SettlementsPage;
