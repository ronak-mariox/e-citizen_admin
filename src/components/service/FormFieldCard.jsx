import Icon from '../dashboard/Icon.jsx';
import FieldTypeSelector from './FieldTypeSelector.jsx';
import FieldOptionsEditor from './FieldOptionsEditor.jsx';
import FieldFileEditor from './FieldFileEditor.jsx';
import FieldValidationEditor from './FieldValidationEditor.jsx';
import ConditionalFieldEditor from './ConditionalFieldEditor.jsx';
import {
  FIELD_HELP_MAX,
  FIELD_KEY_MAX,
  FIELD_LABEL_MAX,
  FIELD_PLACEHOLDER_MAX,
  FIELD_SECTION_MAX,
  OPTION_TYPES,
  PLACEHOLDER_TYPES,
  createOption,
  fieldTypeLabel,
  keyFromLabel,
} from '../../constants/serviceForm.js';

/* One field on the citizen's application form, as the admin configures it.

   Collapsed it is a summary line — position, label, type, whether it is
   required — because a service with fifteen fields is a list to scan, not
   fifteen open forms. Expanded it shows only what the chosen type can use:
   options for a dropdown, a range for a number, nothing extra for a tick box.

   The card is what gets dragged. `draggable` is switched on by the grip and off
   again when the drag ends, so a text selection inside an input never turns
   into a drag of the whole card. */

export function FormFieldCard({
  field,
  index,
  total,
  expanded,
  errors = {},
  sections,
  candidates,
  dragging,
  dragOver,
  onChange,
  onRemove,
  onToggle,
  onMove,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDragHandle,
}) {
  const set = (part, value) => onChange({ ...field, [part]: value });

  /* The key is suggested from the label until someone edits it. After that it
     is theirs: a key is written into every stored application, and quietly
     rewriting it while the label is being reworded would be the worst kind of
     helpful. */
  const setLabel = (label) => {
    const derived = field.key === '' || field.key === keyFromLabel(field.label);

    onChange({ ...field, label, key: derived ? keyFromLabel(label) : field.key });
  };

  /* Changing the type takes the previous type's extras with it — a pattern left
     over from `text` would still be sent when the field is now a date. Options
     survive a move between the three list types, since those are the same list. */
  const setType = (type) => {
    const keepOptions = OPTION_TYPES.includes(type) && OPTION_TYPES.includes(field.type);

    onChange({
      ...field,
      type,
      options: keepOptions ? field.options : OPTION_TYPES.includes(type) ? [createOption()] : [],
      validation: { pattern: '', minLength: '', maxLength: '', min: '', max: '' },
      placeholder: PLACEHOLDER_TYPES.includes(type) ? field.placeholder : '',
    });
  };

  const hasErrors = Object.keys(errors).length > 0;
  const listId = `sections-${field.uid}`;

  const className = [
    'field-card',
    dragging ? 'field-card--dragging' : '',
    dragOver ? 'field-card--over' : '',
    hasErrors ? 'field-card--invalid' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={className}
      draggable={dragging}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={(event) => {
        event.preventDefault();
        onDragEnd();
      }}
    >
      <header className="field-card__head">
        <span
          className="field-card__grip"
          aria-hidden="true"
          onMouseDown={onDragHandle}
          onMouseUp={onDragEnd}
        >
          <Icon name="grip" size={15} />
        </span>

        <button
          className="field-card__summary"
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <span className="field-card__order">#{field.displayOrder}</span>
          <span className="field-card__label">{field.label || 'Untitled field'}</span>
          <span className="tag tag--slate">{fieldTypeLabel(field.type)}</span>
          {field.isRequired && <span className="tag tag--blue">Required</span>}
          {hasErrors && <span className="tag tag--red">Needs attention</span>}
          <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={15} />
        </button>

        {/* Drag is a mouse gesture; these are the same move from a keyboard. */}
        <span className="row-actions">
          <button
            className="icon-button"
            type="button"
            aria-label={`Move ${field.label || 'field'} up`}
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
          >
            <Icon name="arrowUp" size={14} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={`Move ${field.label || 'field'} down`}
            disabled={index === total - 1}
            onClick={() => onMove(index + 1)}
          >
            <Icon name="arrowDown" size={14} />
          </button>
          <button
            className="icon-button icon-button--danger"
            type="button"
            aria-label={`Remove ${field.label || 'field'}`}
            onClick={onRemove}
          >
            <Icon name="trash" size={14} />
          </button>
        </span>
      </header>

      {expanded && (
        <div className="field-card__body">
          <div className="builder__grid">
            <label className="field2">
              <span className="field2__label">Field label *</span>
              <input
                className="field2__input"
                value={field.label}
                maxLength={FIELD_LABEL_MAX}
                placeholder="Enter the label the citizen reads"
                onChange={(event) => setLabel(event.target.value)}
              />
              {errors.label ? (
                <span className="field2__hint field2__hint--error">{errors.label}</span>
              ) : (
                <span className="field2__hint">What the citizen reads above the input.</span>
              )}
            </label>

            <label className="field2">
              <span className="field2__label">Field key *</span>
              <input
                className="field2__input"
                value={field.key}
                maxLength={FIELD_KEY_MAX}
                placeholder="Enter a unique field key"
                spellCheck="false"
                autoCapitalize="none"
                onChange={(event) => set('key', event.target.value)}
              />
              {errors.key ? (
                <span className="field2__hint field2__hint--error">{errors.key}</span>
              ) : (
                <span className="field2__hint">
                  What the answer is stored under. Suggested from the label — change it before the
                  service goes live, not after.
                </span>
              )}
            </label>

            <FieldTypeSelector value={field.type} error={errors.type} onChange={setType} />

            {PLACEHOLDER_TYPES.includes(field.type) && (
              <label className="field2">
                <span className="field2__label">Placeholder</span>
                <input
                  className="field2__input"
                  value={field.placeholder}
                  maxLength={FIELD_PLACEHOLDER_MAX}
                  placeholder="Enter the placeholder shown inside the field"
                  onChange={(event) => set('placeholder', event.target.value)}
                />
                <span className="field2__hint">Grey example text inside the empty input.</span>
              </label>
            )}

            <label className="field2">
              <span className="field2__label">Section</span>
              <input
                className="field2__input"
                value={field.section}
                maxLength={FIELD_SECTION_MAX}
                placeholder="Enter a section name"
                list={listId}
                onChange={(event) => set('section', event.target.value)}
              />
              <datalist id={listId}>
                {sections.map((section) => (
                  <option value={section} key={section} />
                ))}
              </datalist>
              <span className="field2__hint">
                Fields sharing a section are grouped under one heading.
              </span>
            </label>

            <label className="field2">
              <span className="field2__label">Display order</span>
              <input
                className="field2__input"
                type="number"
                value={field.displayOrder}
                min={1}
                max={total}
                step={1}
                onChange={(event) => {
                  const position = Number(event.target.value);

                  // A cleared box is mid-edit, not a request to move to the
                  // top, and a position past the end is not a position.
                  if (event.target.value === '' || !Number.isFinite(position)) return;
                  if (position < 1 || position > total) return;

                  onMove(position - 1);
                }}
              />
              <span className="field2__hint">
                Or drag the card. The rest renumber themselves around it.
              </span>
            </label>

            <label className="field2 field2--full">
              <span className="field2__label">Help text</span>
              <input
                className="field2__input"
                value={field.helpText}
                maxLength={FIELD_HELP_MAX}
                placeholder="Enter the help text shown under the field"
                onChange={(event) => set('helpText', event.target.value)}
              />
              <span className="field2__hint">Shown under the input, in smaller grey type.</span>
            </label>

            <label className="field2 field2--full field-card__check">
              <input
                type="checkbox"
                checked={field.isRequired}
                onChange={(event) => set('isRequired', event.target.checked)}
              />
              <span>
                Required — the citizen cannot submit the application without answering this.
              </span>
            </label>
          </div>

          {OPTION_TYPES.includes(field.type) && (
            <FieldOptionsEditor
              options={field.options}
              error={errors.options}
              onChange={(options) => set('options', options)}
            />
          )}

          {field.type === 'file' && (
            <FieldFileEditor
              uid={field.uid}
              file={field.file}
              error={errors.file}
              onChange={(file) => set('file', file)}
            />
          )}

          <FieldValidationEditor
            type={field.type}
            validation={field.validation}
            onChange={(validation) => set('validation', validation)}
          />

          <ConditionalFieldEditor
            dependsOn={field.dependsOn}
            candidates={candidates}
            error={errors.dependsOn}
            onChange={(dependsOn) => set('dependsOn', dependsOn)}
          />
        </div>
      )}
    </article>
  );
}

export default FormFieldCard;
