import { useState } from 'react';

import Icon from '../dashboard/Icon.jsx';
import FormFieldCard from './FormFieldCard.jsx';
import { createFormField, moveField, renumber } from '../../constants/serviceForm.js';

/* The form the citizen will fill in, built one field at a time.

   The array is the single source of truth for order: `displayOrder` is its
   index restated (see renumber in constants/serviceForm.js), so dragging a
   card, pressing the arrow buttons and typing a new number in the card are
   three ways of doing the same thing, and none of them can disagree with the
   others.

   Reordering is HTML5 drag-and-drop rather than a library — the console ships
   four dependencies and this is the only screen that needs it. The arrow
   buttons are not a fallback for a broken drag; they are how the same move is
   made from a keyboard, which drag-and-drop cannot be. */

export function FormFieldsBuilder({ fields, errors, documents = [], onChange }) {
  // Which cards are open. New ones open on their own — a card added and left
  // collapsed is a field nobody configured.
  const [expanded, setExpanded] = useState(() => new Set());
  const [dragUid, setDragUid] = useState(null);
  const [overUid, setOverUid] = useState(null);

  const toggle = (uid) =>
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(uid)) next.delete(uid);
      else next.add(uid);

      return next;
    });

  const addField = () => {
    const field = createFormField(fields.length + 1);

    onChange([...fields, field]);
    setExpanded((current) => new Set(current).add(field.uid));
  };

  const updateField = (uid, next) =>
    onChange(fields.map((field) => (field.uid === uid ? next : field)));

  const removeField = (uid) => onChange(renumber(fields.filter((field) => field.uid !== uid)));

  const move = (from, to) => onChange(moveField(fields, from, Math.max(0, Math.min(to, fields.length - 1))));

  const handleDragEnter = (uid) => {
    if (!dragUid || uid === dragUid) return;

    const from = fields.findIndex((field) => field.uid === dragUid);
    const to = fields.findIndex((field) => field.uid === uid);

    setOverUid(uid);
    move(from, to);
  };

  const endDrag = () => {
    setDragUid(null);
    setOverUid(null);
  };

  // Only fields above this one, and only those with a key — a rule can point at
  // a question the citizen has already answered, and at nothing else.
  const candidatesFor = (index) =>
    fields.slice(0, index).filter((field) => field.key.trim());

  const sections = [...new Set(fields.map((field) => field.section.trim()).filter(Boolean))];

  /* The names typed under Required documents, offered on each field's label.
     A field that collects the Sale Deed should be called "Sale Deed", and
     retyping it is how the two end up spelt differently. Blank rows are not
     suggestions, and the same name twice is one suggestion. */
  const documentNames = [...new Set(documents.map((name) => name.trim()).filter(Boolean))];

  const invalid = fields.filter((field) => errors[field.uid]).length;

  return (
    <section className="form__group">
      <div className="builder__head">
        <div>
          <h2 className="form__group-title">Application form fields</h2>
          <p className="form__group-hint">
            What the citizen is asked when they apply. Stored on the service itself, so a new
            service needs no code and no migration.
          </p>
        </div>

        <span className="builder__tally">
          {fields.length} field{fields.length === 1 ? '' : 's'}
          {invalid > 0 && <span className="tag tag--red">{invalid} to fix</span>}
        </span>
      </div>

      {fields.length === 0 ? (
        <div className="empty empty--inset">
          <span className="empty__icon">
            <Icon name="applications" size={20} />
          </span>
          <p className="empty__title">No fields added yet</p>
          <p className="empty__text">
            A service with no fields can still be published — the citizen simply submits an
            application with nothing on it. Add the questions the department needs answered.
          </p>
        </div>
      ) : (
        <div className="builder__list">
          {fields.map((field, index) => (
            <FormFieldCard
              key={field.uid}
              field={field}
              index={index}
              total={fields.length}
              expanded={expanded.has(field.uid)}
              errors={errors[field.uid]}
              sections={sections}
              documents={documentNames}
              candidates={candidatesFor(index)}
              dragging={dragUid === field.uid}
              dragOver={overUid === field.uid && dragUid !== field.uid}
              onChange={(next) => updateField(field.uid, next)}
              onRemove={() => removeField(field.uid)}
              onToggle={() => toggle(field.uid)}
              onMove={(to) => move(index, to)}
              onDragHandle={() => setDragUid(field.uid)}
              onDragStart={(event) => {
                // Firefox starts no drag at all without payload on the transfer.
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', field.uid);
              }}
              onDragEnter={() => handleDragEnter(field.uid)}
              onDragEnd={endDrag}
            />
          ))}
        </div>
      )}

      <div className="builder__actions">
        <button className="btn btn--primary btn--sm" type="button" onClick={addField}>
          <Icon name="plus" size={13} />
          Add form field
        </button>
      </div>
    </section>
  );
}

export default FormFieldsBuilder;
