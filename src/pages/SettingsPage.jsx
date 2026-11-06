import { useSearchParams } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import SettingsTabs from '../components/settings/SettingsTabs.jsx';
import RolesPanel from '../components/settings/RolesPanel.jsx';
import IntegrationsPanel from '../components/settings/IntegrationsPanel.jsx';
import { DEFAULT_SETTINGS_TAB, findTab } from '../constants/settings.js';
import '../styles/settings.css';

/* Settings — where the platform is configured rather than worked.

   Two panels behind one tab strip, because they are both answers to "how is
   this set up?": what a role means (Roles & Permissions) and what this
   deployment is wired to outside itself — MSG91, SMTP, Razorpay, Firebase
   (Third Party Integrations, IntegrationsPanel).

   Administrator accounts, agents and citizens are not tabs here. Working on
   a person belongs on the roster you are working from, and duplicating those
   actions behind a settings tab left two places to do one job. The catalogue
   and the audit trail moved out for the same reason and are now
   /departments, /services and /audit-log.

   The active tab rides in the query string so a panel can be linked to and
   survives a reload — ?tab=system opens Integrations directly. */

export function SettingsPage() {
  const [params, setParams] = useSearchParams();

  // An unknown tab falls back rather than rendering nothing — a hand-typed
  // query string should not be able to blank the page.
  const activeTab = findTab(params.get('tab'))?.id ?? DEFAULT_SETTINGS_TAB;

  const selectTab = (id) => setParams(id === DEFAULT_SETTINGS_TAB ? {} : { tab: id });

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Settings</h1>
            <p className="page__subtitle">What each role may do, and how the platform behaves</p>
          </div>
        </div>

        <SettingsTabs activeTab={activeTab} onSelect={selectTab} />

        <div className="settings-panel">
          {activeTab === 'roles' && <RolesPanel />}
          {activeTab === 'system' && <IntegrationsPanel />}
        </div>
      </main>
    </DashboardLayout>
  );
}

export default SettingsPage;
