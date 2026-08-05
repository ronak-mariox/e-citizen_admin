import logoShield from '../assets/icons/logo-shield.svg';
import statBuilding from '../assets/icons/stat-building.svg';
import statFile from '../assets/icons/stat-file.svg';
import statCheck from '../assets/icons/stat-check.svg';
import statClock from '../assets/icons/stat-clock.svg';
import { BRAND } from '../constants/brand.js';

/* Platform-wide figures rather than one operator's — an admin's first question
   is the health of the whole system, not of a personal queue. Placeholder
   values standing in for the dashboard API. */
const STATS = [
  { icon: statBuilding, value: '14', label: 'Departments Live' },
  { icon: statFile, value: '186', label: 'Services Published' },
  { icon: statCheck, value: '42', label: 'Active Agents' },
  { icon: statClock, value: '99.2%', label: 'Platform Uptime' },
];

export function BrandPanel() {
  return (
    <aside className="brand-panel">
      <span className="brand-panel__blob brand-panel__blob--one" aria-hidden="true" />
      <span className="brand-panel__blob brand-panel__blob--two" aria-hidden="true" />
      <span className="brand-panel__blob brand-panel__blob--three" aria-hidden="true" />

      <div className="brand-panel__brand">
        <div className="brand-panel__mark">
          <img src={logoShield} alt="" width="18.749" height="18.749" />
        </div>
        <div>
          <p className="brand-panel__name">{BRAND.portal}</p>
          <p className="brand-panel__org">{BRAND.org}</p>
        </div>
      </div>

      <h2 className="brand-panel__headline">{BRAND.headline}</h2>

      <p className="brand-panel__copy">{BRAND.copy}</p>

      <div className="brand-panel__stats">
        {STATS.map((stat) => (
          <div className="stat-tile" key={stat.label}>
            <img className="stat-tile__icon" src={stat.icon} alt="" width="14.992" height="14.992" />
            <p className="stat-tile__value">{stat.value}</p>
            <p className="stat-tile__label">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="brand-panel__footer">
        <p className="brand-panel__ministry">{BRAND.ministry}</p>
        <p className="brand-panel__notice">{BRAND.notice}</p>
      </div>
    </aside>
  );
}

export default BrandPanel;
