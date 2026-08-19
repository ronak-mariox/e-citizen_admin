import Icon from '../dashboard/Icon.jsx';

/* The papers a citizen has to bring — names only.

   This is the list the service page shows before anyone starts an application,
   so they can go and find the documents. It is deliberately just text: naming
   "Sale Deed" here does not create an upload box for it, and it does not have
   to. Where a document is actually collected is a `file` question in the form
   builder below, and a service may well name something here that it checks at
   a counter rather than collecting online. */

export function ServiceDocuments({ documents, onChange }) {
  const set = (index, value) =>
    onChange(documents.map((entry, position) => (position === index ? value : entry)));

  const add = () => onChange([...documents, '']);

  const remove = (index) =>
    onChange(documents.filter((_, position) => position !== index));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= documents.length) return;

    const next = [...documents];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <section className="form__group">
      <h2 className="form__group-title">Required documents</h2>
      <p className="form__group-hint">
        Listed on the service page so a citizen knows what to gather before starting. One name
        per row, in the order they should read.
      </p>

      {documents.length === 0 && (
        <p className="field2__hint">
          None yet — the service page leaves the section out until there is one.
        </p>
      )}

      {documents.length > 0 && (
        <div className="repeater">
          {documents.map((document, index) => (
            // Position is the identity: these are plain strings with nothing
            // stabler to key on.
            <div className="repeater__row" key={index}>
              <input
                className="field2__input"
                value={document}
                maxLength={200}
                placeholder="e.g. Aadhaar Card (self-attested)"
                onChange={(event) => set(index, event.target.value)}
              />

              <button
                className="icon-button"
                type="button"
                aria-label={`Move document ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <Icon name="arrowUp" size={14} />
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label={`Move document ${index + 1} down`}
                disabled={index === documents.length - 1}
                onClick={() => move(index, 1)}
              >
                <Icon name="arrowDown" size={14} />
              </button>
              <button
                className="icon-button icon-button--danger"
                type="button"
                aria-label={`Remove document ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn--quiet btn--sm" type="button" onClick={add}>
        <Icon name="plus" size={14} />
        Add document
      </button>
    </section>
  );
}

export default ServiceDocuments;
