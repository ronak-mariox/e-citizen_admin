import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Icon from '../dashboard/Icon.jsx';
import PanelCard from './PanelCard.jsx';
import ActiveTogglePill from '../integrations/ActiveTogglePill.jsx';
import CredentialSummaryCard from '../integrations/CredentialSummaryCard.jsx';
import CredentialForm from '../integrations/CredentialForm.jsx';
import * as integrationsApi from '../../api/integrations.js';
import { getErrorMessage } from '../../api/client.js';
import { useLiveRefresh } from '../../hooks/useLiveRefresh.js';
import { INTEGRATION_META, INTEGRATION_ORDER } from '../../constants/integrationFields.js';
import '../../styles/integrations.css';

/**
 * Settings › System Config — third-party integration credentials. SMS,
 * Email, Payment and Firebase, one sub-tab each, all under this one
 * Settings tab rather than four separate sidebar entries: this is
 * configuration the same way Team Members and Roles are, not a section of
 * work on its own.
 *
 * The sub-tab rides in the query string alongside the outer one —
 * `?tab=system&integration=email` — the same "linkable, survives a reload"
 * reasoning SettingsPage already applies to the outer tab strip.
 */
export function IntegrationsPanel() {
  const [params, setParams] = useSearchParams();
  const type = INTEGRATION_ORDER.includes(params.get('integration'))
    ? params.get('integration')
    : INTEGRATION_ORDER[0];
  const meta = INTEGRATION_META[type];

  const selectType = (next) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('integration', next);
    setParams(nextParams);
  };

  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState(null);

  const [testMobile, setTestMobile] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  /* A change saved elsewhere refetches quietly: the summary and toggle update
     in place; the credential forms hold their own input and are left alone. */
  const [reloadToken, setReloadToken] = useState(0);
  const quietReload = useRef(false);
  useLiveRefresh(() => {
    quietReload.current = true;
    setReloadToken((token) => token + 1);
  }, ['settings']);

  useEffect(() => {
    let cancelled = false;
    const quiet = quietReload.current;
    quietReload.current = false;

    if (!quiet) {
      setLoading(true);
      setLoadError(null);
      setToggleError(null);
      setTestResult(null);
    }

    integrationsApi
      .getIntegration(type)
      .then((data) => {
        if (cancelled) return;
        setIntegration(data);
        setLoadError(null);
      })
      .catch((failure) => {
        if (!cancelled && !quiet) setLoadError(getErrorMessage(failure));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type, reloadToken]);

  async function handleSave(fields) {
    const updated = await integrationsApi.updateIntegrationCredentials(type, fields);
    setIntegration(updated);
  }

  async function handleToggle() {
    setToggling(true);
    setToggleError(null);

    try {
      const updated = await integrationsApi.setIntegrationActive(type, !integration.isActive);
      setIntegration(updated);
    } catch (failure) {
      setToggleError(getErrorMessage(failure));
    } finally {
      setToggling(false);
    }
  }

  async function handleTestSms(event) {
    event.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      await integrationsApi.sendTestSms(testMobile);
      setTestResult({ ok: true, message: 'Sent — MSG91 accepted the request. Check the phone for the code.' });
    } catch (failure) {
      setTestResult({ ok: false, message: getErrorMessage(failure) });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="int-panel">
      <div className="int-subtabs" role="tablist" aria-label="Integration">
        {INTEGRATION_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={key === type}
            className={`settings-tab int-subtab ${key === type ? 'settings-tab--active' : ''}`}
            onClick={() => selectType(key)}
          >
            <Icon name={INTEGRATION_META[key].icon} size={15} />
            {INTEGRATION_META[key].provider}
          </button>
        ))}
      </div>

      <div className="int-panel__head">
        <div>
          <h3 className="int-panel__title">{meta.title}</h3>
          <p className="int-panel__subtitle">{meta.subtitle}</p>
        </div>

        {integration && (
          <ActiveTogglePill
            isActive={integration.isActive}
            canActivate={integration.isConfigured}
            busy={toggling}
            onToggle={handleToggle}
          />
        )}
      </div>

      {toggleError && (
        <p className="notice notice--error" role="alert">
          {toggleError}
        </p>
      )}

      {loading && (
        <p className="notice">
          <Icon name="refresh" size={15} />
          Reading the current configuration…
        </p>
      )}

      {loadError && (
        <p className="notice notice--error" role="alert">
          {loadError}
        </p>
      )}

      {integration && (
        <>
          <CredentialSummaryCard integration={integration} fieldSchema={meta.fields} provider={meta.provider} />

          {meta.scaffoldNotice && (
            <p className="notice notice--info">
              <Icon name="shield" size={14} />
              {meta.scaffoldNotice}
            </p>
          )}

          <CredentialForm
            title={`Update ${meta.provider} Credentials`}
            icon={meta.icon}
            notice={meta.notice}
            provider={meta.provider}
            fields={meta.fields}
            onSave={handleSave}
          />

          {meta.webhookPath && (
            <p className="notice notice--info int-webhook">
              <Icon name="shield" size={14} />
              <span>
                <strong>Webhook URL — add this in Razorpay Dashboard → Settings → Webhooks</strong> once
                payments go live through this integration.
                <br />
                <code>{`${import.meta.env.VITE_API_BASE_URL}${meta.webhookPath}`}</code>
                <br />
                Active events to select there: {meta.webhookEvents.map((event, index) => (
                  <span key={event}>
                    {index > 0 && ' and '}
                    <strong>{event}</strong>
                  </span>
                ))}
                . Use the same secret entered above.
              </span>
            </p>
          )}

          {type === 'sms' && (
            <PanelCard title="Test SMS">
              <p className="field2__hint">Send a test OTP (123456) to verify your configuration is working.</p>

              <form className="int-test" onSubmit={handleTestSms}>
                <input
                  className="field2__input"
                  type="tel"
                  inputMode="numeric"
                  value={testMobile}
                  placeholder="Enter 10-digit mobile number"
                  onChange={(event) => setTestMobile(event.target.value)}
                />
                <button className="btn btn--primary" type="submit" disabled={testing || !integration.isActive}>
                  <Icon name="send" size={13} />
                  {testing ? 'Sending…' : 'Send Test'}
                </button>
              </form>

              {!integration.isActive && (
                <p className="field2__hint">Activate this integration above before sending a test.</p>
              )}

              {testResult && (
                <p className={`notice ${testResult.ok ? '' : 'notice--error'}`} role="status">
                  {testResult.message}
                </p>
              )}
            </PanelCard>
          )}

          {type === 'firebase' && meta.pushCredential && (
            <CredentialForm
              title="Server Push Notifications"
              icon="shield"
              notice={meta.pushCredential.notice}
              fields={[meta.pushCredential]}
              onSave={handleSave}
              submitLabel="Save Push Credentials"
            />
          )}
        </>
      )}
    </div>
  );
}

export default IntegrationsPanel;
