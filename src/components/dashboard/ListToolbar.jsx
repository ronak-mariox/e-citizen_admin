import Icon from './Icon.jsx';

/**
 * Search box plus whatever filters a list needs.
 *
 * Shared because all three list screens open with the same row — a search
 * field, some selects, then export/refresh pushed right — and three hand-rolled
 * copies would drift within a sprint. Anything list-specific goes in as
 * children rather than as a prop, so this stays a layout and not a config
 * format.
 */
export function ListToolbar({ value, onChange, placeholder = 'Search…', children }) {
  return (
    <section className="toolbar" aria-label="List controls">
      <label className="toolbar__search">
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
    </section>
  );
}

export default ListToolbar;
