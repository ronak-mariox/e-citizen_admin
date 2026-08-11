import { useSearchParams } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import SettingsTabs from '../components/settings/SettingsTabs.jsx';
import TeamMembersPanel from '../components/settings/TeamMembersPanel.jsx';
import RolesPanel from '../components/settings/RolesPanel.jsx';
import SystemConfigPanel from '../components/settings/SystemConfigPanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_SETTINGS_TAB, findTab } from '../constants/settings.js';
import '../styles/settings.css';

/* Settings — where the platform is configured rather than worked.

   Three panels behind one tab strip, because they are all answers to "how is
   this set up?": who can sign in (Team Members), what a role means (Roles &
   Permissions) and how the API behaves (System Config). Three sidebar entries
   would bury two of them.

   Agents and citizens are not tabs here. Working on a person belongs on the
   roster you are working from: an agent is created, edited, suspended and
   removed from /agents, and duplicating those actions behind a settings tab
   left two places to do one job. The catalogue and the audit trail moved out
   for the same reason and are now /departments, /services and /audit-log.

   The active tab rides in the query string so a panel can be linked to and
   survives a reload — ?tab=roles opens the permission list directly. */

export function SettingsPage() {
  const { user } = useAuth();
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
            <p className="page__subtitle">
              Who holds a back-office account, what each role may do, and how the platform behaves
            </p>
          </div>
        </div>

        <SettingsTabs activeTab={activeTab} onSelect={selectTab} />

        <div className="settings-panel">
          {activeTab === 'team' && <TeamMembersPanel user={user} />}
          {activeTab === 'roles' && <RolesPanel />}
          {activeTab === 'system' && <SystemConfigPanel />}
        </div>
      </main>
    </DashboardLayout>
  );
}

export default SettingsPage;
