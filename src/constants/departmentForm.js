/* Options for the "create department" form.

   Every rule below is copied from backend/src/models/department.js so the form
   cannot build a document Mongo would reject:
     name          required, unique, ≤ 200
     code          required, unique, IMMUTABLE, 2–5 letters
     description   ≤ 2000
     officeAddress ≤ 500
     contactEmail  ≤ 120, lowercased on write
     contactPhone  ≤ 20
     status        CATALOG_STATUS, defaults to draft
     displayOrder  number, defaults to 0

   `slug` is absent on purpose — the schema derives it from the name in a
   pre-validate hook, so asking for it would be asking for something the server
   is going to overwrite. `createdBy` is taken from the session server-side. */

export const NAME_MAX = 200;
export const DESCRIPTION_MAX = 2000;
export const ADDRESS_MAX = 500;
export const EMAIL_MAX = 120;
export const PHONE_MAX = 20;

/** The schema's /^[A-Z]{2,5}$/, relaxed to either case so typing feels normal. */
export const CODE_PATTERN = '[A-Za-z]{2,5}';
export const CODE_MAX = 5;

/* CATALOG_STATUS, minus the two that are outcomes rather than starting points —
   nothing is created inactive, and nothing is created archived. */
export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft — set it up now, open it later' },
  { value: 'active', label: 'Active — services and agents can be added straight away' },
];

/**
 * The slug the API will derive, mirroring the pre-validate hook in
 * models/department.js. Shown rather than asked for, so nobody is surprised by
 * the URL their department ends up on.
 */
export const slugPreview = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* On edit the whole lifecycle is available — deactivating and archiving are
   exactly what an edit is for, they are just not ways to open a department. */
export const EDIT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft — not visible to citizens' },
  { value: 'active', label: 'Active — open for applications' },
  { value: 'inactive', label: 'Inactive — temporarily closed' },
  { value: 'archived', label: 'Archived — retired, kept for history' },
];

export function emptyDepartmentForm() {
  return {
    name: '',
    code: '',
    description: '',
    officeAddress: '',
    contactEmail: '',
    contactPhone: '',
    status: 'draft',
    displayOrder: '0',
    icon: '',
  };
}

/** An existing department, in the shape the form holds. */
export function departmentToForm(department) {
  return {
    name: department.name ?? '',
    code: department.code ?? '',
    description: department.description ?? '',
    officeAddress: department.officeAddress ?? '',
    contactEmail: department.contactEmail ?? '',
    contactPhone: department.contactPhone ?? '',
    status: department.status ?? 'draft',
    displayOrder: String(department.displayOrder ?? 0),
    icon: department.icon ?? '',
  };
}

/**
 * Form state -> the Department document the API creates.
 *
 * Blank optionals are dropped rather than sent as empty strings: the schema
 * gives them no default, and a stored '' is a value that later has to be
 * distinguished from "never filled in".
 */
export function buildDepartmentPayload(form) {
  const payload = {
    name: form.name.trim(),
    code: form.code.trim().toUpperCase(),
    status: form.status,
    displayOrder: Number(form.displayOrder) || 0,
  };

  const optional = {
    description: form.description.trim(),
    officeAddress: form.officeAddress.trim(),
    contactEmail: form.contactEmail.trim().toLowerCase(),
    contactPhone: form.contactPhone.trim(),
    icon: form.icon.trim(),
  };

  Object.entries(optional).forEach(([key, value]) => {
    if (value) payload[key] = value;
  });

  return payload;
}

/**
 * Form state -> a PATCH body.
 *
 * No `name` and no `code`: both are fixed at creation, and the API rejects
 * either outright rather than ignoring it. A department that has genuinely
 * become something else is archived and replaced, not renamed.
 *
 * Blanked optionals are sent as '' rather than dropped — on a create an empty
 * field means "never filled in", but on an edit it means "clear what was
 * there", and omitting it would silently keep the old value.
 */
export function buildDepartmentUpdate(form) {
  return {
    status: form.status,
    displayOrder: Number(form.displayOrder) || 0,
    description: form.description.trim(),
    officeAddress: form.officeAddress.trim(),
    contactEmail: form.contactEmail.trim().toLowerCase(),
    contactPhone: form.contactPhone.trim(),
    icon: form.icon.trim(),
  };
}
