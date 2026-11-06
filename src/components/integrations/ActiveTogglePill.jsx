import Icon from '../dashboard/Icon.jsx';

/**
 * The Active/Inactive pill at the top of an integration's page — a real
 * toggle, not a status label. This is the feature's whole point: an admin
 * flips this once credentials are saved, and every provider module that was
 * reading "not configured" starts reading real ones instead.
 *
 * Disabled while `busy` (a request is in flight) or while turning on with
 * `canActivate` false — the backend refuses that anyway (a required field is
 * still missing), so the button says so up front rather than round-tripping
 * to find out.
 */
export function ActiveTogglePill({ isActive, canActivate, busy, onToggle }) {
  const blocked = !isActive && !canActivate;

  return (
    <button
      type="button"
      className={`int-toggle int-toggle--${isActive ? 'on' : 'off'}`}
      onClick={onToggle}
      disabled={busy || blocked}
      title={blocked ? 'Save the required credentials before activating' : undefined}
    >
      <Icon name="shield" size={13} />
      {busy ? 'Updating…' : isActive ? 'Active' : 'Inactive'}
    </button>
  );
}

export default ActiveTogglePill;
