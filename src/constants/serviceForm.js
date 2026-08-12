/* Options and payload builders for the "create service" form.

   Every rule below is copied from backend/src/models/service.js so the form
   cannot build a document Mongo would reject:
     name             required, ≤ 200
     shortDescription ≤ 300
     description      ≤ 5000
     department       required, ObjectId -> Department
     category         optional, ObjectId -> ServiceCategory
     applicationMode  online | offline | hybrid, defaults to online
     formFields[]     embedded, keys unique (schema-level validator)

   And per embedded form field:
     key          required, ≤ 60
     label        required, ≤ 160
     type         one of FIELD_TYPE_VALUES, defaults to text
     placeholder  ≤ 160
     helpText     ≤ 500
     isRequired   boolean, defaults to false
     options[]    { label, value }
     validation   { pattern, minLength, maxLength, min, max }
     dependsOn    { field, equals: [String] }
     section      ≤ 120
     displayOrder number, defaults to 0

   `slug` and `code` are absent on purpose: the schema derives the slug from the
   name in a pre-validate hook. `status` is asked for, and defaults to inactive,
   so a new service is never published by accident. */

export const NAME_MAX = 200;
export const SHORT_DESCRIPTION_MAX = 300;
export const DESCRIPTION_MAX = 5000;

export const FIELD_KEY_MAX = 60;
export const FIELD_LABEL_MAX = 160;
export const FIELD_PLACEHOLDER_MAX = 160;
export const FIELD_HELP_MAX = 500;
export const FIELD_SECTION_MAX = 120;

/* The schema's enum, in the order an admin is likely to reach for them rather
   than the order they happen to sit in the model. `hint` is what the option
   means to a citizen filling the form in. */
export const FIELD_TYPES = [
  { value: 'text', label: 'Text', hint: 'A single line' },
  { value: 'textarea', label: 'Paragraph', hint: 'Several lines' },
  { value: 'number', label: 'Number', hint: 'Digits only, with an optional range' },
  { value: 'date', label: 'Date', hint: 'A day picked from a calendar' },
  { value: 'select', label: 'Dropdown', hint: 'One of a list' },
  { value: 'multiselect', label: 'Multi-select', hint: 'Any number from a list' },
  { value: 'radio', label: 'Radio buttons', hint: 'One of a short list, all visible' },
  { value: 'checkbox', label: 'Checkbox', hint: 'A single yes/no tick' },
  { value: 'file', label: 'File upload', hint: 'A document or photo' },
  { value: 'mobile', label: 'Mobile number', hint: 'A 10-digit Indian mobile' },
  { value: 'email', label: 'Email', hint: 'An email address' },
  { value: 'address', label: 'Address', hint: 'A multi-line postal address' },
];

export const FIELD_TYPE_VALUES = FIELD_TYPES.map((type) => type.value);

export const fieldTypeLabel = (value) =>
  FIELD_TYPES.find((type) => type.value === value)?.label ?? value;

/** Types whose answer comes from a list the admin writes. */
export const OPTION_TYPES = ['select', 'multiselect', 'radio'];

/** Types where a placeholder is shown at all — a tick or a file button has no room for one. */
export const PLACEHOLDER_TYPES = [
  'text',
  'textarea',
  'number',
  'select',
  'multiselect',
  'mobile',
  'email',
  'address',
];

/* Which of the five `validation` keys are worth offering for a type. A pattern
   on a date picker or a minimum length on a tick box would be stored happily
   and then never mean anything, so they are not offered. */
const VALIDATION_KEYS_BY_TYPE = {
  text: ['pattern', 'minLength', 'maxLength'],
  textarea: ['minLength', 'maxLength'],
  address: ['minLength', 'maxLength'],
  mobile: ['pattern', 'minLength', 'maxLength'],
  email: ['pattern', 'maxLength'],
  number: ['min', 'max'],
};

export const validationKeysFor = (type) => VALIDATION_KEYS_BY_TYPE[type] ?? [];

/* Upload rules for a `file` field — the schema's fileFieldSchema, which is
   where the old `requiredDocuments` checklist now lives. A file field IS the
   checklist item, so these are configured with the question, not beside it. */
export const FILE_MIME_TYPES = [
  { value: 'application/pdf', label: 'PDF' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'application/msword', label: 'DOC' },
  {
    value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: 'DOCX',
  },
];

/** The model's own default — PDF or a photo covers almost every counter. */
export const DEFAULT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const MAX_UPLOAD_MB = 50;
export const MAX_FILES_PER_FIELD = 10;

/* The citizen locker's document types (citizen_profile.js). Naming one lets the
   locker offer a verified copy the citizen already uploaded instead of asking
   for the same scan again — which is the whole point of the locker. */
export const LOCKER_DOCUMENT_TYPES = [
  'aadhaar',
  'pan',
  'voter_id',
  'driving_license',
  'passport',
  'ration_card',
  'birth_certificate',
  'caste_certificate',
  'income_certificate',
  'domicile_certificate',
  'marksheet',
  'photo',
  'signature',
  'address_proof',
  'bank_passbook',
  'other',
];

export const VALIDATION_LABELS = {
  pattern: 'Pattern (regular expression)',
  minLength: 'Minimum length',
  maxLength: 'Maximum length',
  min: 'Minimum value',
  max: 'Maximum value',
};

/* Fees. The schema keeps every amount as an integer in paise (common_schema.js)
   and the API takes it that way; the console asks for rupees, because that is
   what a fee notification from a department is written in. One conversion, at
   the payload boundary — nothing downstream deals in rupees. */
export const toPaise = (rupees) => {
  const parsed = Number(rupees);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

export const FEE_FIELDS = [
  {
    key: 'govtFee',
    label: 'Government fee',
    hint: 'The statutory fee the department charges. Zero if the service is free.',
  },
  {
    key: 'serviceCharge',
    label: 'Service charge',
    hint: 'What the platform keeps for handling the application. GST applies to this.',
  },
  {
    key: 'deliveryCharge',
    label: 'Delivery charge',
    hint: 'Courier or postage, when the output is not a download.',
  },
];

/* Stored as basis points — 1800 is 18% — so the rate can be changed without
   touching stored amounts. These are the GST slabs, not free text. */
export const GST_RATES = [
  { value: '0', label: 'No GST' },
  { value: '500', label: '5%' },
  { value: '1200', label: '12%' },
  { value: '1800', label: '18%' },
  { value: '2800', label: '28%' },
];

/**
 * What the citizen is billed, in paise — the same arithmetic as the `gstAmount`
 * and `totalFee` virtuals on the Service model.
 *
 * Duplicated here so the form can show the total while it is being typed. The
 * server stays the authority: this is a preview, not the figure that is stored.
 */
export function feeTotals(fees) {
  const govtFee = toPaise(fees.govtFee);
  const serviceCharge = toPaise(fees.serviceCharge);
  const deliveryCharge = toPaise(fees.deliveryCharge);

  // GST is charged on the platform's service charge, not the statutory fee.
  const gst = Math.round((serviceCharge * Number(fees.gstBasisPoints || 0)) / 10000);
  const billedGovtFee = fees.isGovtFeePaidByCitizen ? govtFee : 0;

  return {
    govtFee,
    serviceCharge,
    deliveryCharge,
    gst,
    billedGovtFee,
    total: billedGovtFee + serviceCharge + deliveryCharge + gst,
  };
}

/* Timeline. Two different promises, which is why the schema keeps two fields:
   `processingDays` is the range the citizen is quoted, `slaHours` is the
   internal target an agent is measured against and a breach feeds their
   performance. The first is usually generous, the second is not. */
export const MAX_PROCESSING_DAYS = 365;
export const MAX_SLA_HOURS = 8760;

export function emptyTimeline() {
  // The schema's own defaults, so a service created without a thought about
  // this still quotes something sane.
  return { processingMinDays: '1', processingMaxDays: '7', slaHours: '48' };
}

/** An existing service's timeline, in the shape the form holds. */
export function timelineToForm(service = {}) {
  return {
    processingMinDays: String(service.processingDays?.min ?? 1),
    processingMaxDays: String(service.processingDays?.max ?? 7),
    slaHours: String(service.slaHours ?? 48),
  };
}

export function buildTimelinePayload(timeline) {
  return {
    processingDays: {
      min: Number(timeline.processingMinDays) || 0,
      max: Number(timeline.processingMaxDays) || 0,
    },
    slaHours: Number(timeline.slaHours) || 0,
  };
}

/**
 * What is wrong with the timeline, in one sentence, or null.
 *
 * The ordering rule cannot be expressed with `min`/`max` on the inputs — it is
 * about two of them at once — so it is checked here and again by the schema's
 * pre-validate hook.
 */
export function validateTimeline(timeline) {
  const min = Number(timeline.processingMinDays);
  const max = Number(timeline.processingMaxDays);
  const sla = Number(timeline.slaHours);

  if (!Number.isInteger(min) || min < 0 || !Number.isInteger(max) || max < 0) {
    return 'Processing time must be a whole number of days.';
  }
  if (min > max) {
    return 'The fastest processing time cannot be longer than the slowest.';
  }
  if (max > MAX_PROCESSING_DAYS) {
    return `Processing time cannot exceed ${MAX_PROCESSING_DAYS} days.`;
  }
  if (!Number.isInteger(sla) || sla < 0 || sla > MAX_SLA_HOURS) {
    return `The SLA must be a whole number of hours, up to ${MAX_SLA_HOURS}.`;
  }

  return null;
}

/** "48 hours (2 days)" — hours are the unit, days are how people think. */
export function slaLabel(hours) {
  const value = Number(hours);

  if (!Number.isFinite(value) || value <= 0) return 'No target set';
  if (value < 24) return `${value} hours`;

  const days = value / 24;

  return `${value} hours (${Number.isInteger(days) ? days : days.toFixed(1)} days)`;
}

/* CATALOG_STATUS in full — a service is in the catalogue or it is not, and the
   same two are offered whether it is being created or edited. */
export const STATUS_OPTIONS = [
  {
    value: 'active',
    label: 'Active — live in the catalogue',
    note: 'Citizens can find this service and apply for it as soon as it is saved. The form below is what they will fill in.',
  },
  {
    value: 'inactive',
    label: 'Inactive — invisible to citizens',
    note: 'Nothing is listed and nothing can be applied for. Build the form out, price it and preview it here first; applications already filed stay readable.',
  },
];

export const EDIT_STATUS_OPTIONS = STATUS_OPTIONS;

export const statusNote = (value) =>
  EDIT_STATUS_OPTIONS.find((option) => option.value === value)?.note ?? '';

export const APPLICATION_MODES = [
  { value: 'online', label: 'Online — the citizen applies here' },
  { value: 'offline', label: 'Offline — filed at a counter' },
  { value: 'hybrid', label: 'Hybrid — started here, finished at a counter' },
];

/* A key is a handle the application document is stored under and the one thing
   `dependsOn.field` points at, so it is kept to characters that survive being
   used as an object key and read back in a URL. The schema itself only trims
   and caps the length — this is the console being stricter than it has to be,
   on purpose. */
export const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

/** "Applicant Name" -> "applicant_name". Suggested, never forced. */
export function keyFromLabel(label) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, FIELD_KEY_MAX);
}

// Client-side identity for a field card. Never sent: Mongo assigns the _id.
let uidCounter = 0;
const nextUid = () => {
  uidCounter += 1;
  return `ff-${uidCounter}`;
};

export function emptyServiceForm() {
  return {
    name: '',
    shortDescription: '',
    description: '',
    department: '',
    category: '',
    applicationMode: 'online',
    // The schema's own default. A service nobody has priced or built a form for
    // should not be open for applications the moment it is saved.
    status: 'inactive',
    // Rupees while the admin is typing; converted to paise on submit.
    fees: emptyFees(),
    timeline: emptyTimeline(),
  };
}

export function emptyFees() {
  return {
    govtFee: '0',
    serviceCharge: '0',
    deliveryCharge: '0',
    gstBasisPoints: '0',
    isGovtFeePaidByCitizen: true,
  };
}

/** An existing service's fees, back in the shape the form holds. */
export function feesToForm(fees = {}) {
  const rupees = (paise) => String((paise ?? 0) / 100);

  return {
    govtFee: rupees(fees.govtFee),
    serviceCharge: rupees(fees.serviceCharge),
    deliveryCharge: rupees(fees.deliveryCharge),
    gstBasisPoints: String(fees.gstBasisPoints ?? 0),
    isGovtFeePaidByCitizen: fees.isGovtFeePaidByCitizen ?? true,
  };
}

/**
 * A blank field card.
 *
 * Everything the schema knows about is present from the start — held as strings
 * because that is what an <input> gives back, and converted once on submit.
 */
export function createFormField(displayOrder = 1) {
  return {
    uid: nextUid(),
    key: '',
    label: '',
    type: 'text',
    placeholder: '',
    helpText: '',
    isRequired: false,
    options: [],
    validation: { pattern: '', minLength: '', maxLength: '', min: '', max: '' },
    file: emptyFileRules(),
    dependsOn: { field: '', equals: [] },
    section: '',
    displayOrder,
  };
}

/** fileFieldSchema's own defaults, so a new file field is usable untouched. */
export function emptyFileRules() {
  return {
    documentType: '',
    acceptFromLocker: true,
    allowedMimeTypes: [...DEFAULT_MIME_TYPES],
    maxSizeMb: '5',
    maxFiles: '1',
  };
}

export const createOption = () => ({ label: '', value: '' });

/** An existing service's formFields, in the shape the builder holds. */
export function formFieldToState(field, index) {
  return {
    uid: nextUid(),
    key: field.key ?? '',
    label: field.label ?? '',
    type: FIELD_TYPE_VALUES.includes(field.type) ? field.type : 'text',
    placeholder: field.placeholder ?? '',
    helpText: field.helpText ?? '',
    isRequired: Boolean(field.isRequired),
    options: (field.options ?? []).map((option) => ({
      label: option.label ?? '',
      value: option.value ?? '',
    })),
    validation: {
      pattern: field.validation?.pattern ?? '',
      minLength: field.validation?.minLength ?? '',
      maxLength: field.validation?.maxLength ?? '',
      min: field.validation?.min ?? '',
      max: field.validation?.max ?? '',
    },
    file: {
      documentType: field.file?.documentType ?? '',
      acceptFromLocker: field.file?.acceptFromLocker ?? true,
      allowedMimeTypes: field.file?.allowedMimeTypes ?? [...DEFAULT_MIME_TYPES],
      maxSizeMb: String(field.file?.maxSizeMb ?? 5),
      maxFiles: String(field.file?.maxFiles ?? 1),
    },
    dependsOn: {
      field: field.dependsOn?.field ?? '',
      equals: field.dependsOn?.equals ?? [],
    },
    section: field.section ?? '',
    displayOrder: field.displayOrder ?? index + 1,
  };
}

/**
 * displayOrder is the array's own order, restated.
 *
 * Called after every add, remove and move, so the number on a card and the
 * position of that card can never disagree — and the payload never has to be
 * sorted, because it is already in order.
 */
export const renumber = (fields) =>
  fields.map((field, index) => ({ ...field, displayOrder: index + 1 }));

/** Moves one card to a new index and renumbers what is left. */
export function moveField(fields, from, to) {
  if (from === to || from < 0 || to < 0 || from >= fields.length || to >= fields.length) {
    return fields;
  }

  const next = fields.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  return renumber(next);
}

const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');

/** '' and a non-number both mean "not set", and neither belongs in the payload. */
function numberOrUndefined(value) {
  if (value === '' || value == null) return undefined;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * One card -> one entry in `formFields`.
 *
 * Blank optionals are dropped rather than sent as empty strings: the schema
 * gives them no default, and a stored '' is a value that later has to be told
 * apart from "never filled in". `options`, `validation` and `dependsOn` are
 * only included when the type uses them and something was actually entered.
 */
export function buildFormFieldPayload(field, index) {
  const payload = {
    key: trimmed(field.key),
    label: trimmed(field.label),
    type: field.type,
    isRequired: Boolean(field.isRequired),
    displayOrder: index + 1,
  };

  if (PLACEHOLDER_TYPES.includes(field.type) && trimmed(field.placeholder)) {
    payload.placeholder = trimmed(field.placeholder);
  }
  if (trimmed(field.helpText)) payload.helpText = trimmed(field.helpText);
  if (trimmed(field.section)) payload.section = trimmed(field.section);

  if (OPTION_TYPES.includes(field.type)) {
    const options = field.options
      .map((option) => ({ label: trimmed(option.label), value: trimmed(option.value) }))
      .filter((option) => option.label || option.value);

    if (options.length) payload.options = options;
  }

  const validation = {};
  validationKeysFor(field.type).forEach((key) => {
    const raw = field.validation?.[key];

    if (key === 'pattern') {
      if (trimmed(raw)) validation.pattern = trimmed(raw);
      return;
    }

    const parsed = numberOrUndefined(raw);
    if (parsed !== undefined) validation[key] = parsed;
  });

  if (Object.keys(validation).length) payload.validation = validation;

  // Upload rules travel with the field they belong to, and only with a file
  // field — this is the document checklist, not a second list beside it.
  if (field.type === 'file') {
    payload.file = {
      acceptFromLocker: Boolean(field.file?.acceptFromLocker),
      allowedMimeTypes: field.file?.allowedMimeTypes ?? [],
      maxSizeMb: numberOrUndefined(field.file?.maxSizeMb) ?? 5,
      maxFiles: numberOrUndefined(field.file?.maxFiles) ?? 1,
    };

    if (trimmed(field.file?.documentType)) {
      payload.file.documentType = trimmed(field.file.documentType);
    }
  }

  const dependsOnField = trimmed(field.dependsOn?.field);
  const equals = (field.dependsOn?.equals ?? []).map(trimmed).filter(Boolean);

  if (dependsOnField && equals.length) {
    payload.dependsOn = { field: dependsOnField, equals };
  }

  return payload;
}

/** Rupee strings -> the paise the schema stores. */
export function buildFeesPayload(fees) {
  return {
    govtFee: toPaise(fees.govtFee),
    serviceCharge: toPaise(fees.serviceCharge),
    deliveryCharge: toPaise(fees.deliveryCharge),
    gstBasisPoints: Number(fees.gstBasisPoints) || 0,
    isGovtFeePaidByCitizen: Boolean(fees.isGovtFeePaidByCitizen),
  };
}

/**
 * Form state -> the Service document the API creates.
 *
 * `formFields` is embedded, exactly as the schema holds it — there is no
 * separate collection and no second request.
 */
export function buildServicePayload(form, fields) {
  const payload = {
    name: trimmed(form.name),
    department: form.department,
    applicationMode: form.applicationMode,
    status: form.status,
    // Paise from here on — the only place rupees are converted. A form with no
    // fee block at all is a free service, not a crash.
    fees: buildFeesPayload(form.fees ?? emptyFees()),
    ...buildTimelinePayload(form.timeline ?? emptyTimeline()),
    formFields: fields.map(buildFormFieldPayload),
  };

  if (trimmed(form.shortDescription)) payload.shortDescription = trimmed(form.shortDescription);
  if (trimmed(form.description)) payload.description = trimmed(form.description);
  if (form.category) payload.category = form.category;

  return payload;
}

/**
 * Form state -> a PATCH body.
 *
 * Blanked optionals are sent as '' rather than dropped: on a create an empty
 * field means "never filled in", but on an edit it means "clear what was
 * there", and omitting it would silently keep the old value.
 *
 * `category` is the exception — it is an id, and the schema has no empty id to
 * store, so clearing one needs a route of its own rather than a blank string.
 * `slug` is never sent: it is derived once, so a reworded service keeps the
 * address citizens already have.
 */
export function buildServiceUpdate(form, fields) {
  const payload = {
    name: trimmed(form.name),
    shortDescription: trimmed(form.shortDescription),
    description: trimmed(form.description),
    department: form.department,
    applicationMode: form.applicationMode,
    status: form.status,
    fees: buildFeesPayload(form.fees ?? emptyFees()),
    ...buildTimelinePayload(form.timeline ?? emptyTimeline()),
    formFields: fields.map(buildFormFieldPayload),
  };

  if (form.category) payload.category = form.category;

  return payload;
}

/**
 * What is wrong with the builder, per card.
 *
 * Returns `{ [uid]: { key?, label?, type?, options?, dependsOn? } }` — empty
 * when the whole builder is sound. Duplicate keys are caught here rather than
 * left to the server: the schema's `formFields` validator rejects the entire
 * service for one repeated key, and "formFields contains duplicate keys" does
 * not say which two.
 */
export function validateFormFields(fields) {
  const errors = {};
  const seen = new Map();

  const fail = (uid, part, message) => {
    errors[uid] = { ...errors[uid], [part]: message };
  };

  const keys = new Set(fields.map((field) => trimmed(field.key)).filter(Boolean));

  fields.forEach((field) => {
    const key = trimmed(field.key);
    const label = trimmed(field.label);

    if (!key) {
      fail(field.uid, 'key', 'A key is required — it is what the answer is stored under.');
    } else if (!KEY_PATTERN.test(key)) {
      fail(
        field.uid,
        'key',
        'Use lowercase letters, digits and underscores, starting with a letter.'
      );
    } else if (seen.has(key)) {
      fail(field.uid, 'key', `Already used by field #${seen.get(key)}. Keys must be unique.`);
    }

    if (key && !seen.has(key)) seen.set(key, field.displayOrder);

    if (!label) fail(field.uid, 'label', 'A label is required — it is what the citizen reads.');

    if (!FIELD_TYPE_VALUES.includes(field.type)) {
      fail(field.uid, 'type', 'Pick one of the supported field types.');
    }

    if (OPTION_TYPES.includes(field.type)) {
      const filled = field.options.filter(
        (option) => trimmed(option.label) && trimmed(option.value)
      );

      if (!filled.length) {
        fail(field.uid, 'options', 'Add at least one option with both a label and a value.');
      } else if (filled.length !== field.options.length) {
        fail(field.uid, 'options', 'Every option needs both a label and a value.');
      } else {
        const values = filled.map((option) => trimmed(option.value));

        if (new Set(values).size !== values.length) {
          fail(field.uid, 'options', 'Two options share a value — a stored answer would be ambiguous.');
        }
      }
    }

    if (field.type === 'file') {
      const size = Number(field.file?.maxSizeMb);
      const files = Number(field.file?.maxFiles);

      if (!field.file?.allowedMimeTypes?.length) {
        fail(field.uid, 'file', 'Choose at least one accepted file type.');
      } else if (!Number.isInteger(size) || size < 1 || size > MAX_UPLOAD_MB) {
        fail(field.uid, 'file', `Maximum size must be a whole number between 1 and ${MAX_UPLOAD_MB} MB.`);
      } else if (!Number.isInteger(files) || files < 1 || files > MAX_FILES_PER_FIELD) {
        fail(field.uid, 'file', `Number of files must be between 1 and ${MAX_FILES_PER_FIELD}.`);
      }
    }

    const dependsOnField = trimmed(field.dependsOn?.field);

    if (dependsOnField) {
      if (dependsOnField === key) {
        fail(field.uid, 'dependsOn', 'A field cannot depend on itself.');
      } else if (!keys.has(dependsOnField)) {
        fail(field.uid, 'dependsOn', 'That field no longer exists. Pick another, or clear the rule.');
      } else if (!(field.dependsOn?.equals ?? []).map(trimmed).filter(Boolean).length) {
        fail(field.uid, 'dependsOn', 'Give at least one value the field has to match.');
      }
    }
  });

  return errors;
}

/**
 * The placeholder a citizen sees inside a generated field.
 *
 * The admin's own wording wins whenever they gave one. When they did not, this
 * derives an instruction from the field's type and label — "Select Date of
 * Birth", "Upload Aadhaar Card" — rather than falling back to a bare "Select…"
 * or to nothing at all.
 *
 * Preview only. Nothing here is written into `formFields`: the stored
 * `placeholder` stays exactly what the admin typed, including empty.
 */
export function previewPlaceholder(field) {
  const configured = trimmed(field.placeholder);
  if (configured) return configured;

  // The label is used as written — lowercasing it would turn "Aadhaar Card"
  // into "aadhaar card" for the sake of a grammar rule nobody is reading.
  const subject = trimmed(field.label);

  switch (field.type) {
    // Formats worth stating outright, whatever the field happens to be called.
    case 'mobile':
      return 'Enter a 10-digit mobile number';
    case 'email':
      return 'Enter an email address';

    case 'date':
      return subject ? `Select ${subject}` : 'Select a date';
    case 'select':
      return subject ? `Select ${subject}` : 'Select an option';
    case 'multiselect':
      return subject ? `Choose ${subject}` : 'Choose one or more options';
    case 'file':
      return subject ? `Upload ${subject}` : 'Upload a file';

    default:
      return subject ? `Enter ${subject}` : 'Enter a value';
  }
}

/** Whether a preview field is on screen, given the answers so far. */
export function isFieldVisible(field, answers) {
  const dependsOnField = trimmed(field.dependsOn?.field);
  const equals = (field.dependsOn?.equals ?? []).map(trimmed).filter(Boolean);

  if (!dependsOnField || !equals.length) return true;

  const answer = answers[dependsOnField];

  // A multi-select answers with an array, and the rule passes if any one of the
  // chosen values is listed.
  if (Array.isArray(answer)) return answer.some((value) => equals.includes(String(value)));

  return equals.includes(String(answer ?? ''));
}

/**
 * Preview fields grouped the way the citizen sees them: in displayOrder, under
 * the section each field names. Fields with no section fall into one unnamed
 * group so they are not silently dropped.
 */
export function groupBySection(fields) {
  const groups = [];

  fields.forEach((field) => {
    const section = trimmed(field.section);
    const existing = groups.find((group) => group.section === section);

    if (existing) {
      existing.fields.push(field);
      return;
    }

    groups.push({ section, fields: [field] });
  });

  return groups;
}
