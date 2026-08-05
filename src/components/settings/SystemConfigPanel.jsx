import Icon from '../dashboard/Icon.jsx';
import PanelCard from './PanelCard.jsx';
import { SYSTEM_CONFIG_GROUPS } from '../../constants/settings.js';

/* System configuration.

   Every value here is read from the API's environment at boot
   (backend/src/config/env.js), so the panel shows it and names the variable
   instead of offering an input that could not save. Naming the variable is the
   whole point: "10 minutes" is a number nobody can find again, OTP_TTL_MINUTES
   is a number anyone can change. */

export function SystemConfigPanel() {
  return (
    <>
      <p className="notice notice--info">
        <Icon name="alert" size={15} />
        Read-only. These come from the API environment — change them in the backend&apos;s .env and
        restart the server.
      </p>

      {SYSTEM_CONFIG_GROUPS.map((group) => (
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
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      ))}
    </>
  );
}

export default SystemConfigPanel;
