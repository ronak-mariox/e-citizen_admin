import Icon from './Icon.jsx';

/**
 * Row count and paging, under a table.
 *
 * Pass `page`, `totalPages` and `onPageChange` on a screen whose list comes
 * from a paginated API and the controls work. Leave them off and the footer
 * still renders, inert — screens still on sample arrays have one page and
 * nothing to move between, and a disabled control keeps the footer at its real
 * height so nothing jumps when they are wired up.
 */
export function TableFooter({ shown, total, noun = 'records', page = 1, totalPages = 1, onPageChange }) {
  const canPage = typeof onPageChange === 'function';
  const lastPage = Math.max(1, totalPages);

  return (
    <div className="table__foot">
      <p className="table__count">
        Showing {shown} of {total} {noun}
      </p>

      <div className="pagination">
        <button
          className="pagination__step"
          type="button"
          aria-label="Previous page"
          disabled={!canPage || page <= 1}
          onClick={() => onPageChange?.(page - 1)}
        >
          <Icon name="chevronLeft" size={13} />
        </button>

        <button className="pagination__page pagination__page--active" type="button">
          {page}
        </button>

        <button
          className="pagination__step"
          type="button"
          aria-label="Next page"
          disabled={!canPage || page >= lastPage}
          onClick={() => onPageChange?.(page + 1)}
        >
          <Icon name="chevronRight" size={13} />
        </button>
      </div>
    </div>
  );
}

export default TableFooter;
