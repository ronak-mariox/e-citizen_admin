/**
 * The white card every settings panel sits in.
 *
 * `count` rides inside the title rather than beside it — "Team Members (11)" is
 * one label, and a figure that can wrap away from its noun is a figure nobody
 * can read. `flush` is for a card that ends in a table: the head and the search
 * stay inset while the rows run to the border.
 */
export function PanelCard({ title, count, subtitle, action, flush = false, children }) {
  return (
    <section className={flush ? 'card card--flush' : 'card'}>
      <div className="card__head">
        <div>
          <h2 className="card__title">
            {title}
            {count != null && <span className="card__count"> ({count})</span>}
          </h2>
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

export default PanelCard;
