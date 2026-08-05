import { useLocation } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { NAV_ITEMS } from '../constants/navigation.js';

/** Keeps the designed sidebar navigable while these sections are still to come. */
export function SectionPlaceholderPage() {
  const { pathname } = useLocation();
  const section = NAV_ITEMS.find((item) => item.to === pathname);

  return (
    <DashboardLayout>
      <main className="dash-page">
        <div className="dash-page__head">
          <div>
            <h1 className="dash-page__title">{section?.label ?? 'Section'}</h1>
            <p className="dash-page__subtitle">This screen has not been designed yet.</p>
          </div>
        </div>
        <p className="dash-placeholder">
          Share the Figma node for this section and it will be built here.
        </p>
      </main>
    </DashboardLayout>
  );
}

export default SectionPlaceholderPage;
