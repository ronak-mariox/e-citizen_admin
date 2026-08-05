import Icon from '../dashboard/Icon.jsx';

/**
 * The search row inside a settings card.
 *
 * Separate from components/dashboard/ListToolbar.jsx on purpose: that one is
 * the bar *above* a list screen and carries export and refresh; this one sits
 * inside a card and only narrows the rows below it. Filters go in as children.
 */
export function PanelSearch({ value, onChange, placeholder = 'Search…', children }) {
  return (
    <div className="settings-search">
      <label className="settings-search__field">
        <Icon name="search" size={14} />
        <input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={placeholder}
        />
      </label>

      {children}
    </div>
  );
}

export default PanelSearch;
