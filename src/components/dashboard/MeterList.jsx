/**
 * A share-of-total breakdown, one labelled meter per row.
 *
 * The agent panels use a donut for this. Theirs has four short labels; the
 * admin's application statuses are things like "Submitted to Department", which
 * a donut legend cannot hold without truncating. Rows give each label a full
 * line and keep the comparison readable.
 */
export function MeterList({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="meter-list">
      {items.map((item) => (
        <div className="meter" key={item.key}>
          <div className="meter__head">
            <span className="meter__label">
              <span className="legend__dot" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="meter__value">
              {item.value.toLocaleString('en-IN')}
              {' · '}
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
          <span className="meter__track">
            <span
              className="meter__fill"
              style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

export default MeterList;
