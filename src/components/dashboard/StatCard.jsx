import Icon from './Icon.jsx';

/**
 * A headline figure.
 *
 * `accent` is a hex colour owned by the card's data (see constants/dashboard.js)
 * rather than a modifier class: the tiles form a sequence of hues, and adding a
 * new one should not also mean adding a CSS rule. The icon wash is the same hue
 * at 12% — `1f` is that alpha in hex.
 */
export function StatCard({ icon, accent, value, label, hint, hintTone, trend, onClick }) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={onClick ? 'stat-card stat-card--link' : 'stat-card'}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
    >
      <span className="stat-card__top">
        <span className="stat-card__icon" style={{ color: accent, backgroundColor: `${accent}1f` }}>
          <Icon name={icon} size={19} />
        </span>

        {trend && (
          <span className={`stat-card__trend stat-card__trend--${trend.direction}`}>
            <Icon name={trend.direction === 'up' ? 'trendUp' : 'trendDown'} size={12} />
            {trend.value}
          </span>
        )}
      </span>

      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
      {hint && (
        <span
          className={
            hintTone === 'danger' ? 'stat-card__hint stat-card__hint--danger' : 'stat-card__hint'
          }
        >
          {hint}
        </span>
      )}
    </Tag>
  );
}

export default StatCard;
