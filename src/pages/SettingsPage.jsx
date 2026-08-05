import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import SettingsTabs from '../components/settings/SettingsTabs.jsx';
import TeamMembersPanel from '../components/settings/TeamMembersPanel.jsx';
import OperationsPanel from '../components/settings/OperationsPanel.jsx';
import AgentStatusPanel from '../components/settings/AgentStatusPanel.jsx';
import RolesPanel from '../components/settings/RolesPanel.jsx';
import SystemConfigPanel from '../components/settings/SystemConfigPanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  AGENT_OPERATIONS,
  CITIZEN_OPERATIONS,
  DEFAULT_SETTINGS_TAB,
  findTab,
} from '../constants/settings.js';
import '../styles/settings.css';

/* Settings — where the platform is configured rather than worked.

   Six panels behind one tab strip, because they are all answers to "how is this
   set up?": who can sign in (Team Members, Agents), what may be done to a
   person (Agent and Citizen Management), what a role means (Roles &
   Permissions) and how the API behaves (System Config). Six sidebar entries
   would bury five of them.

   Creating an agent is not its own tab: it belongs to the roster you are adding
   to, so it opens from the Add Agent button on the Agents tab — and from the
   same button on /agents, which shares the flow.

   The catalogue and the audit trail used to live here too and are now their own
   sections — /departments, /services and /audit-log. They are worked daily
   rather than set up once, and their tables need a full page.

   The active tab rides in the query string so a panel can be linked to and
   survives a reload — ?tab=roles opens the permission list directly. */

export function SettingsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  // An unknown tab falls back rather than rendering nothing — a hand-typed
  // query string should not be able to blank the page.
  const activeTab = findTab(params.get('tab'))?.id ?? DEFAULT_SETTINGS_TAB;

  /* Which operation is open inside a tab, when one of them does its work here
     rather than on a list screen. Deliberately not in the query string: it is a
     step in a task, not a place, and reloading part-way through a suspension
     should land back on the list rather than half inside it. */
  const [agentAction, setAgentAction] = useState(null);

  const selectTab = (id) => {
    setAgentAction(null);
    setParams(id === DEFAULT_SETTINGS_TAB ? {} : { tab: id });
  };

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Settings</h1>
            <p className="page__subtitle">
              Manage staff accounts, the service catalogue and how the platform behaves
            </p>
          </div>
        </div>

        <SettingsTabs activeTab={activeTab} onSelect={selectTab} />

        <div className="settings-panel">
          {activeTab === 'team' && <TeamMembersPanel user={user} />}

          {/* {activeTab === 'agents' && <AgentsPanel />} */}

          {/* One operation is performed here rather than on the roster, so the
              tab swaps to it and back. */}
          {activeTab === 'agent-actions' && agentAction === 'status' && (
            <AgentStatusPanel onBack={() => setAgentAction(null)} />
          )}

          {activeTab === 'agent-actions' && !agentAction && (
            <OperationsPanel
              title="Agent management"
              subtitle="Everything you can do to an existing agent"
              operations={AGENT_OPERATIONS}
              onAction={setAgentAction}
              linkTo="/agents"
              linkLabel="Open roster"
            />
          )}

          {activeTab === 'citizens' && (
            <OperationsPanel
              title="Citizen management"
              subtitle="Citizens sign up themselves — these are the admin actions"
              operations={CITIZEN_OPERATIONS}
              linkTo="/citizens"
              linkLabel="Open citizens"
            />
          )}

          {activeTab === 'roles' && <RolesPanel />}
          {activeTab === 'system' && <SystemConfigPanel />}
        </div>
      </main>
    </DashboardLayout>
  );
}

export default SettingsPage;
