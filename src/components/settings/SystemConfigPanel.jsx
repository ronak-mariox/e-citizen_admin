import { useEffect, useState } from 'react';

import Icon from '../dashboard/Icon.jsx';
import PanelCard from './PanelCard.jsx';
import * as adminsApi from '../../api/admins.js';
import { getErrorMessage } from '../../api/client.js';

/* System configuration, read from the running API.

   Every row is a live value from GET /admins/system-config, which is a
   whitelist assembled in backend/src/services/systemConfig.service.js — the
   secrets sit in the same env object and are deliberately not in it.

   Each row still names the variable behind it, which is the point of the
   screen: "10 minutes" is a number nobody can find again, OTP_TTL_MINUTES is a
   number anyone can change. Read-only for the same reason — these are read once
   at boot, so an input here could not save. */

const minutes = (value) => `${value} minute${value === 1 ? '' : 's'}`;

const days = (ms) => {
  const count = Math.round(ms / 86400000);

  return `${count} day${count === 1 ? '' : 's'}`;
};

const megabytes = (bytes) => `${Math.round((bytes / 1048576) * 10) / 10} MB`;

const uptime = (seconds) => {
  if (seconds < 60) return `${seconds}s`;

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  return hours ? `${hours}h ${mins}m` : `${mins}m`;
};

const yesNo = (value) => (value ? 'Yes' : 'No');

/** Group definitions, built from the response rather than hard-coded. */
const groupsFor = (config) => [
  {
    id: 'environment',
    title: 'Environment',
    hint: 'Which build this is. It decides most of what follows.',
    rows: [
      { label: 'Mode', value: config.environment.nodeEnv, source: 'NODE_ENV' },
      { label: 'API prefix', value: config.environment.apiPrefix, source: 'API_PREFIX' },
      { label: 'Node', value: config.environment.nodeVersion, source: 'runtime' },
      { label: 'Uptime', value: uptime(config.environment.uptimeSeconds), source: 'runtime' },
    ],
  },
  {
    id: 'sessions',
    title: 'Sessions & tokens',
    hint: 'A session is a short access token plus a rotating refresh cookie.',
    rows: [
      { label: 'Access token lifetime', value: config.sessions.accessTtl, source: 'JWT_ACCESS_TTL' },
      { label: 'Refresh token lifetime', value: config.sessions.refreshTtl, source: 'JWT_REFRESH_TTL' },
      {
        label: 'Password-reset token lifetime',
        value: config.sessions.resetTtl,
        source: 'JWT_RESET_TTL',
      },
      {
        label: 'Refresh cookie',
        // One cookie per role, so two consoles on localhost cannot overwrite
        // each other — the role is appended to this name.
        value: `${config.sessions.cookieName}_<role> · httpOnly · sameSite ${config.sessions.cookieSameSite}${
          config.sessions.cookieSecure ? ' · secure' : ''
        }`,
        source: 'REFRESH_COOKIE_NAME',
      },
      {
        label: 'Refresh cookie lifetime',
        value: days(config.sessions.cookieMaxAgeMs),
        source: 'REFRESH_COOKIE_MAX_AGE_MS',
      },
    ],
  },
  {
    id: 'otp',
    title: 'One-time passwords',
    hint: 'Citizen sign-in and staff password reset. Codes live in Redis, never in Mongo.',
    rows: [
      { label: 'Code length', value: `${config.otp.length} digits`, source: 'env.otp.length' },
      { label: 'Validity', value: minutes(config.otp.ttlMinutes), source: 'OTP_TTL_MINUTES' },
      {
        label: 'Maximum attempts',
        value: `${config.otp.maxAttempts} per code`,
        source: 'OTP_MAX_ATTEMPTS',
      },
      {
        label: 'Resend cooldown',
        value: `${config.otp.resendCooldownSeconds} seconds`,
        source: 'OTP_RESEND_COOLDOWN_SECONDS',
      },
      {
        label: 'Returned in the response',
        value: yesNo(config.otp.exposeInResponse),
        source: 'NODE_ENV',
      },
      {
        // Whether a fixed development code is accepted — never what it is.
        label: 'Master code accepted',
        value: yesNo(config.otp.masterEnabled),
        source: 'OTP_MASTER',
      },
    ],
  },
  {
    id: 'platform',
    title: 'Platform',
    hint: 'What this API is talking to.',
    rows: [
      {
        label: 'Database',
        value: `${config.platform.database.name ?? 'unknown'} · ${config.platform.database.state}`,
        source: 'MONGODB_URI',
      },
      { label: 'Database host', value: config.platform.database.host ?? '—', source: 'MONGODB_URI' },
      { label: 'OTP store', value: config.platform.redisHost, source: 'REDIS_URL' },
      { label: 'Redis key prefix', value: config.platform.redisKeyPrefix, source: 'REDIS_KEY_PREFIX' },
      {
        label: 'Allowed origins',
        value: `${config.platform.corsOrigins.length} origins`,
        source: 'CORS_ORIGINS',
        list: config.platform.corsOrigins,
      },
    ],
  },
  {
    id: 'limits',
    title: 'Limits',
    hint: 'Compiled in rather than configured — but the answer to "why was that refused?".',
    rows: [
      {
        label: 'Maximum upload',
        value: megabytes(config.limits.uploadMaxBytes),
        source: 'upload.middleware.js',
      },
      {
        label: 'Accepted image types',
        value: config.limits.uploadTypes.map((type) => type.replace('image/', '')).join(', '),
        source: 'upload.middleware.js',
      },
      {
        label: 'API requests',
        value: `${config.limits.apiRequestsPer15Min} per 15 minutes`,
        source: 'rateLimit.middleware.js',
      },
      {
        label: 'Sign-in attempts',
        value: `${config.limits.authAttemptsPer15Min} per 15 minutes, per account`,
        source: 'rateLimit.middleware.js',
      },
      {
        label: 'OTP requests',
        value: `${config.limits.otpRequestsPer15Min} per 15 minutes, per account`,
        source: 'rateLimit.middleware.js',
      },
    ],
  },
];

/* The values behind the redaction. Labelled with the variable they come from,
   because copying one into a deploy is the reason to look. */
const SECRET_ROWS = [
  { key: 'mongoUri', label: 'Database connection string', source: 'MONGODB_URI' },
  { key: 'redisUrl', label: 'Redis connection string', source: 'REDIS_URL' },
  { key: 'jwtAccessSecret', label: 'Access token secret', source: 'JWT_ACCESS_SECRET' },
  { key: 'jwtRefreshSecret', label: 'Refresh token secret', source: 'JWT_REFRESH_SECRET' },
  { key: 'jwtResetSecret', label: 'Password-reset secret', source: 'JWT_RESET_SECRET' },
  { key: 'otpMaster', label: 'Development master OTP', source: 'OTP_MASTER' },
];

export function SystemConfigPanel() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Credentials are a second, deliberate request rather than part of the first,
  // so simply opening Settings never puts them in the browser.
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    adminsApi
      .getSystemConfig()
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch((failure) => {
        if (!cancelled) setError(getErrorMessage(failure));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reveal = async () => {
    setRevealing(true);
    setError(null);

    try {
      setConfig(await adminsApi.getSystemConfig({ reveal: true }));
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setRevealing(false);
    }
  };

  const hide = () => setConfig((current) => ({ ...current, secrets: undefined }));

  if (loading) {
    return (
      <p className="notice">
        <Icon name="refresh" size={15} />
        Reading the API configuration…
      </p>
    );
  }

  if (error || !config) {
    return (
      <p className="notice notice--error" role="alert">
        <Icon name="alert" size={15} />
        Could not read the API configuration — {error ?? 'no response'}
      </p>
    );
  }

  return (
    <>
      <p className="notice notice--info">
        <Icon name="alert" size={15} />
        Read-only, and read live from the running API. Change them in the backend&apos;s .env and
        restart the server. Secrets — the JWT keys, the database and Redis credentials, the master
        OTP — are deliberately not sent here.
      </p>

      {groupsFor(config).map((group) => (
        <div className="config-group" key={group.id}>
          <PanelCard title={group.title} subtitle={group.hint}>
            <ul className="config-list">
              {group.rows.map((row) => (
                <li key={row.label}>
                  <div className="config-row">
                    <span className="config-row__body">
                      <span className="config-row__label">{row.label}</span>
                      <span className="config-row__source">{row.source}</span>
                    </span>
                    <span className="config-row__value">{row.value}</span>
                  </div>

                  {/* A count is the readable answer; the origins themselves are
                      what someone came here to check. */}
                  {row.list && (
                    <ul className="config-sublist">
                      {row.list.map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      ))}

      <div className="config-group">
        <PanelCard
          title="Credentials"
          subtitle="The connection strings and signing secrets this server booted with."
        >
          <p className="config-warning">
            <Icon name="shield" size={14} />
            Anyone holding these can sign their own tokens and read the database directly. Revealing
            them is written to the audit log.
          </p>

          <ul className="config-list">
            {SECRET_ROWS.map((row) => (
              <li key={row.key}>
                <div className="config-row">
                  <span className="config-row__body">
                    <span className="config-row__label">{row.label}</span>
                    <span className="config-row__source">{row.source}</span>
                  </span>
                </div>

                <p className={config.secrets ? 'config-secret' : 'config-secret config-secret--masked'}>
                  {config.secrets
                    ? (config.secrets[row.key] ?? 'Not set')
                    : '••••••••••••••••••••••••'}
                </p>
              </li>
            ))}
          </ul>

          <div className="config-actions">
            {config.secrets ? (
              <button className="btn btn--sm" type="button" onClick={hide}>
                <Icon name="ban" size={13} />
                Hide again
              </button>
            ) : (
              <button className="btn btn--sm" type="button" disabled={revealing} onClick={reveal}>
                <Icon name={revealing ? 'refresh' : 'eye'} size={13} />
                {revealing ? 'Reading…' : 'Reveal credentials'}
              </button>
            )}
          </div>
        </PanelCard>
      </div>
    </>
  );
}

export default SystemConfigPanel;
