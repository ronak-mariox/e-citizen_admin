import Icon from './Icon.jsx';

/**
 * Recent platform events.
 *
 * An agent's dashboard lists applications, because that is their work. An
 * admin's lists *events* — who did what, to which record — since the admin's
 * job is oversight rather than execution. Each row is one audit entry.
 */
export function ActivityFeed({ items }) {
  return (
    <div className="feed">
      {items.map((item) => (
        <div className="feed__row" key={item.id}>
          <span
            className="feed__icon"
            style={{ color: item.accent, backgroundColor: `${item.accent}1f` }}
          >
            <Icon name={item.icon} size={15} />
          </span>

          <span className="feed__body">
            <span className="feed__text">
              <strong>{item.actor}</strong> {item.action}
            </span>
            <span className="feed__meta">{item.target}</span>
          </span>

          <span className="feed__time">{item.time}</span>
        </div>
      ))}
    </div>
  );
}

export default ActivityFeed;
