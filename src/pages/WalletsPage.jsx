import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import TableFooter from '../components/dashboard/TableFooter.jsx';
import * as walletApi from '../api/wallet.js';
import { getErrorMessage } from '../api/client.js';
import { PAYMENT_METHOD_LABEL, TRANSACTION_LABEL } from '../constants/wallet.js';
import { rupees } from '../utils/format.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';

/* The company wallet — every rupee in and out.

   Credits are citizens paying their application fee and any additional
   payment Agent 2 asked for; debits are the payouts to Agent 2 made from
   Settlements. The ledger is append-only, and each row carries the balance it
   left behind, so it reads as a statement. */

const PAGE_SIZE = 25;
const DATE = { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' };
const stamp = (value) => (value ? new Date(value).toLocaleString('en-IN', DATE) : '—');
const money = (paise) => rupees((paise ?? 0) / 100);

const DIRECTIONS = [
  { key: 'all', label: 'All' },
  { key: 'credit', label: 'Money in' },
  { key: 'debit', label: 'Money out' },
];

const COLUMNS = '1fr 1.1fr 1fr 1.1fr 0.8fr 0.9fr 0.9fr';

export function WalletsPage() {
  const navigate = useNavigate();
  const [direction, setDirection] = useState('all');
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((token) => token + 1);

  /* Live refetches (useLiveRefresh) run quietly: the rows stay up while they
     load, and a failed one keeps them rather than swapping in an error. */
  const quietReload = useRef(false);
  useLiveRefresh(() => {
    quietReload.current = true;
    reload();
  }, ['wallet', 'applications']);

  useEffect(() => {
    let cancelled = false;
    const quiet = quietReload.current;
    quietReload.current = false;

    if (!quiet) {
      setLoading(true);
      setLoadError(null);
    }

    Promise.all([walletApi.getWallet(), walletApi.listTransactions({ page, limit: PAGE_SIZE, direction })])
      .then(([summary, rows]) => {
        if (cancelled) return;
        setLoadError(null);
        setWallet(summary);
        setLedger(rows);
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
  }, [direction, page, reloadToken]);

  const rows = ledger?.transactions ?? [];

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Company Wallet</h1>
            <p className="page__subtitle">
              Citizen payments come in here; payouts to Agent 2 go out from Settlements
            </p>
          </div>

          <div className="page__actions">
            <button className="btn" type="button" onClick={reload} disabled={loading}>
              <Icon name="refresh" size={14} />
              Refresh
            </button>
            <button className="btn btn--primary" type="button" onClick={() => navigate('/settlements')}>
              <Icon name="settlements" size={14} />
              Pay Agent 2
            </button>
          </div>
        </div>

        <div className="stat-grid">
          <StatCard icon="wallet" accent="#0052cc" value={wallet ? money(wallet.balance) : '—'} label="Balance" hint="Held by the company now" />
          <StatCard icon="trendUp" accent="#00a63e" value={wallet ? money(wallet.totalCredited) : '—'} label="Received" hint="All citizen payments, all time" />
          <StatCard icon="trendDown" accent="#fb2c36" value={wallet ? money(wallet.totalDebited) : '—'} label="Paid out" hint="To Agent 2, all time" />
          <StatCard
            icon="clock"
            accent="#fe9a00"
            value={wallet ? money(wallet.payoutsDueAmount) : '—'}
            label="Owed to Agent 2"
            hint={wallet ? `${wallet.payoutsDue} application(s)` : undefined}
            onClick={() => navigate('/settlements')}
          />
        </div>

        <section className="toolbar settle__toolbar" aria-label="Ledger filter">
          <div className="segmented" role="group" aria-label="Direction">
            {DIRECTIONS.map((one) => (
              <button
                className={direction === one.key ? 'segmented__button segmented__button--active' : 'segmented__button'}
                type="button"
                key={one.key}
                aria-pressed={direction === one.key}
                onClick={() => {
                  setDirection(one.key);
                  setPage(1);
                }}
              >
                {one.label}
              </button>
            ))}
          </div>
        </section>

        <section className="table-shell" aria-label="Wallet ledger">
          <div className="table__overflow">
            <div className="table" role="table">
              <div className="table__head" role="row" style={{ gridTemplateColumns: COLUMNS }}>
                <div role="columnheader">When</div>
                <div role="columnheader">What</div>
                <div role="columnheader">Application</div>
                <div role="columnheader">From / to</div>
                <div role="columnheader" className="table__cell table__cell--end">Amount</div>
                <div role="columnheader">Method</div>
                <div role="columnheader" className="table__cell table__cell--end">Balance after</div>
              </div>

              {rows.map((row) => (
                <div className="table__row" role="row" key={row.id} style={{ gridTemplateColumns: COLUMNS }}>
                  <div className="table__cell table__muted" role="cell">{stamp(row.at)}</div>
                  <div className="table__cell" role="cell">{TRANSACTION_LABEL[row.type] ?? row.type}</div>
                  <div className="table__cell" role="cell">{row.applicationNumber ?? '—'}</div>
                  <div className="table__cell table__muted table__truncate" role="cell">
                    {row.direction === 'debit' ? row.agentName ?? '—' : row.actorName ?? '—'}
                  </div>
                  <div
                    className={`table__cell table__cell--end ${row.direction === 'credit' ? 'wallet__in' : 'wallet__out'}`}
                    role="cell"
                  >
                    {row.direction === 'credit' ? '+' : '−'} {money(row.amount)}
                  </div>
                  <div className="table__cell table__muted" role="cell">{PAYMENT_METHOD_LABEL[row.method] ?? '—'}</div>
                  <div className="table__cell table__cell--end table__muted" role="cell">{money(row.balanceAfter)}</div>
                </div>
              ))}

              {loading && rows.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="refresh" size={20} />
                  </span>
                  <p className="empty__title">Loading the ledger…</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="alert" size={20} />
                  </span>
                  <p className="empty__title">Could not load the wallet</p>
                  <p className="empty__text">{loadError}</p>
                  <button className="btn btn--sm" type="button" onClick={reload}>
                    <Icon name="refresh" size={13} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && rows.length === 0 && (
                <div className="empty">
                  <span className="empty__icon">
                    <Icon name="wallet" size={20} />
                  </span>
                  <p className="empty__title">No money has moved yet</p>
                  <p className="empty__text">Rows appear here when a citizen pays, and when you pay an Agent 2.</p>
                </div>
              )}
            </div>
          </div>

          <TableFooter
            shown={rows.length}
            total={ledger?.pagination?.total ?? rows.length}
            noun="transactions"
            page={ledger?.pagination?.page ?? 1}
            totalPages={ledger?.pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </section>
      </main>
    </DashboardLayout>
  );
}

export default WalletsPage;
