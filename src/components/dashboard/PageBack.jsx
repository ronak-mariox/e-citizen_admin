import Icon from './Icon.jsx';

/**
 * The way out of a screen that took over the page — a create or edit form.
 *
 * Above the heading and hard left, which is where a back control is looked for:
 * reading starts in that corner, and the chevron points the way the click goes.
 * It used to sit in `page__actions` on the far right, beside where a page's
 * *forward* actions live — so leaving looked like the primary thing to do, and
 * on a wide screen it was the length of the header away from the title it
 * belonged to.
 *
 * One component rather than the same six lines on four pages, so the label is
 * the only thing that differs between them.
 */
export function PageBack({ label, disabled = false, onClick }) {
  return (
    <button className="btn page__back" type="button" disabled={disabled} onClick={onClick}>
      <Icon name="chevronLeft" size={14} />
      {label}
    </button>
  );
}

export default PageBack;
