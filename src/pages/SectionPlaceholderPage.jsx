import { useLocation } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { NAV_ITEMS } from '../constants/navigation.js';

/* The screen behind every sidebar entry that has not been built yet.

   The heading still names the section, so the page answers which link was
   clicked; the middle just says the rest is not here. Deliberately nothing
   else — a placeholder that fills itself with explanation reads as a feature,
   and this one has to stay obviously empty. */

export function SectionPlaceholderPage() {
  const { pathname } = useLocation();
  const section = NAV_ITEMS.find((item) => item.to === pathname);

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">{section?.label ?? 'Section'}</h1>
          </div>
        </div>

        {/* `margin: auto` inside the page's flex column puts it in the middle
            of the room left over, rather than under the heading. */}
        <p className="coming-soon">Coming soon</p>
      </main>
    </DashboardLayout>
  );
}

export default SectionPlaceholderPage;
