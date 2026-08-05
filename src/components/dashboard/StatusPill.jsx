/** A status badge. `tone` keys into the .pill--* modifiers in dashboard.css —
    get it from constants/statusTone.js rather than choosing one per screen. */
export function StatusPill({ label, tone = 'slate' }) {
  return (
    <span className={`pill pill--${tone}`}>
      <span className="pill__dot" aria-hidden="true" />
      {label}
    </span>
  );
}

/** Priority. Square-cornered and dotless, so it never reads as a status. */
export function PriorityTag({ label, tone = 'slate' }) {
  return <span className={`tag tag--${tone}`}>{label}</span>;
}

export default StatusPill;
