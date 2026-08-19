import Icon from '../dashboard/Icon.jsx';
import { createFaq } from '../../constants/serviceForm.js';

/* The questions a citizen asks before applying.

   Stored in the order they appear here — `displayOrder` is assigned from the
   position on submit, so moving a row is the only thing that changes it and
   nobody has to type a number.

   A half-filled row is dropped rather than rejected: an admin who adds a card
   and thinks better of it should not have to delete it to save the service. */

export function ServiceFaqs({ faqs, onChange }) {
  const set = (uid, name, value) =>
    onChange(faqs.map((faq) => (faq.uid === uid ? { ...faq, [name]: value } : faq)));

  const add = () => onChange([...faqs, createFaq()]);

  const remove = (uid) => onChange(faqs.filter((faq) => faq.uid !== uid));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= faqs.length) return;

    const next = [...faqs];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <section className="form__group">
      <h2 className="form__group-title">FAQs</h2>
      <p className="form__group-hint">
        Answered on the service page, in this order. Every question needs an answer — a card
        with either half blank is left out when the service is saved.
      </p>

      {faqs.length === 0 && (
        <p className="field2__hint">
          No FAQs yet. The service page simply omits the section until there is one.
        </p>
      )}

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <article className="faq-card" key={faq.uid}>
            <header className="faq-card__head">
              <span className="faq-card__position">Q{index + 1}</span>

              <div className="faq-card__actions">
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Move question ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <Icon name="arrowUp" size={14} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Move question ${index + 1} down`}
                  disabled={index === faqs.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <Icon name="arrowDown" size={14} />
                </button>
                <button
                  className="icon-button icon-button--danger"
                  type="button"
                  aria-label={`Remove question ${index + 1}`}
                  onClick={() => remove(faq.uid)}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </header>

            <label className="field2">
              <span className="field2__label">Question</span>
              <input
                className="field2__input"
                value={faq.question}
                maxLength={300}
                placeholder="What a citizen would ask in their own words"
                onChange={(event) => set(faq.uid, 'question', event.target.value)}
              />
            </label>

            <label className="field2">
              <span className="field2__label">Answer</span>
              <textarea
                className="field2__input field2__input--area"
                value={faq.answer}
                maxLength={2000}
                rows={3}
                placeholder="Answer it plainly, without pointing at another page"
                onChange={(event) => set(faq.uid, 'answer', event.target.value)}
              />
            </label>
          </article>
        ))}
      </div>

      <button className="btn btn--quiet btn--sm" type="button" onClick={add}>
        <Icon name="plus" size={14} />
        Add question
      </button>
    </section>
  );
}

export default ServiceFaqs;
