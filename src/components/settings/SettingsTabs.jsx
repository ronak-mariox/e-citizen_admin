import Icon from '../dashboard/Icon.jsx';
import { SETTINGS_TABS } from '../../constants/settings.js';

/**
 * The settings tab strip.
 *
 * Every tab is shown to everyone who reaches this page. Only `admin` accounts
 * are admitted to this build at all (constants/auth.js PANEL_ROLE), and an
 * admin here holds the whole back office — there is no lesser admin to hide a
 * tab from. The backend still re-checks every request behind them.
 */
export function SettingsTabs({ activeTab, onSelect }) {
  return (
    <nav className="settings-tabs" aria-label="Settings sections">
      {SETTINGS_TABS.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            className={isActive ? 'settings-tab settings-tab--active' : 'settings-tab'}
            type="button"
            key={tab.id}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect(tab.id)}
          >
            <Icon name={tab.icon} size={14} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default SettingsTabs;
