import { useState } from 'react';

import Icon from '../dashboard/Icon.jsx';
import {
  FILE_MIME_TYPES,
  LOCKER_DOCUMENT_TYPES,
  MAX_FILES_PER_FIELD,
  MAX_UPLOAD_MB,
} from '../../constants/serviceForm.js';

/* Upload rules for a `file` field — what a text field's Advanced validation is
   to a text field.

   These used to live on the service's `requiredDocuments`, a second list the
   admin filled in alongside the form. They are on the field now: a file field
   IS the checklist item an agent verifies, so it is configured once, here.

   Open by default, unlike the other disclosures. A file field cannot be asked
   for without saying what is accepted, so the rules are the point of the field
   rather than an extra on top of it. */

export function FieldFileEditor({ uid, file, error, onChange }) {
  const [open, setOpen] = useState(true);

  const set = (part, value) => onChange({ ...file, [part]: value });

  const toggleType = (mime) =>
    set(
      'allowedMimeTypes',
      file.allowedMimeTypes.includes(mime)
        ? file.allowedMimeTypes.filter((current) => current !== mime)
        : [...file.allowedMimeTypes, mime]
    );

  const listId = `locker-types-${uid}`;

  return (
    <div className="builder__block">
      <button
        className="builder__disclosure"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} />
        File upload rules
        <span className="builder__count">{file.allowedMimeTypes.length}</span>
      </button>

      {open && (
        <>
          <div className="field2 builder__wide">
            <span className="field2__label">Accepted file types *</span>
            <div className="chips">
              {FILE_MIME_TYPES.map((mime) => {
                const on = file.allowedMimeTypes.includes(mime.value);

                return (
                  <button
                    className={on ? 'chip chip--on' : 'chip'}
                    type="button"
                    key={mime.value}
                    aria-pressed={on}
                    onClick={() => toggleType(mime.value)}
                  >
                    {mime.label}
                  </button>
                );
              })}
            </div>
            <span className="field2__hint">
              Anything else is refused before it is uploaded, so the citizen finds out at the file
              picker rather than after waiting for a scan to send.
            </span>
          </div>

          <div className="builder__grid">
            <label className="field2">
              <span className="field2__label">Maximum size (MB)</span>
              <input
                className="field2__input"
                type="number"
                value={file.maxSizeMb}
                min={1}
                max={MAX_UPLOAD_MB}
                step={1}
                onChange={(event) => set('maxSizeMb', event.target.value)}
              />
              <span className="field2__hint">
                Phone cameras produce 4–8 MB photos; below that turns a valid document into a
                support ticket.
              </span>
            </label>

            <label className="field2">
              <span className="field2__label">Number of files</span>
              <input
                className="field2__input"
                type="number"
                value={file.maxFiles}
                min={1}
                max={MAX_FILES_PER_FIELD}
                step={1}
                onChange={(event) => set('maxFiles', event.target.value)}
              />
              <span className="field2__hint">
                More than one for a document that runs to several pages photographed separately.
              </span>
            </label>

            <label className="field2">
              <span className="field2__label">Locker document type</span>
              <input
                className="field2__input"
                value={file.documentType}
                list={listId}
                maxLength={60}
                placeholder="Select a document type"
                spellCheck="false"
                onChange={(event) => set('documentType', event.target.value.toLowerCase())}
              />
              <datalist id={listId}>
                {LOCKER_DOCUMENT_TYPES.map((type) => (
                  <option value={type} key={type} />
                ))}
              </datalist>
              <span className="field2__hint">
                Optional. Naming one lets the citizen attach the copy already in their locker.
              </span>
            </label>

            <label className="field2 field-card__check">
              <input
                type="checkbox"
                checked={file.acceptFromLocker}
                onChange={(event) => set('acceptFromLocker', event.target.checked)}
                disabled={!file.documentType}
              />
              <span>
                Accept a verified copy from the locker
                {file.documentType ? '' : ' — needs a document type above'}
              </span>
            </label>
          </div>

          {error && <p className="field2__hint field2__hint--error">{error}</p>}
        </>
      )}
    </div>
  );
}

export default FieldFileEditor;
