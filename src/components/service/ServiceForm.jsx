import { useMemo, useState } from 'react';

import Icon from '../dashboard/Icon.jsx';
import ServiceBasicInfo from './ServiceBasicInfo.jsx';
import ServiceFees from './ServiceFees.jsx';
import ServiceTimeline from './ServiceTimeline.jsx';
import ServiceEligibility from './ServiceEligibility.jsx';
import ServiceDocuments from './ServiceDocuments.jsx';
import ServiceFaqs from './ServiceFaqs.jsx';
import ServicePublishing from './ServicePublishing.jsx';
import FormFieldsBuilder from './FormFieldsBuilder.jsx';
import FormPreview from './FormPreview.jsx';
import {
  buildServicePayload,
  buildServiceUpdate,
  eligibilityToForm,
  emptyServiceForm,
  faqsToForm,
  feesToForm,
  formFieldToState,
  timelineToForm,
  validateFormFields,
  validateTimeline,
} from '../../constants/serviceForm.js';

/* Create or edit a service, including the form a citizen fills in to apply for
   it.

   Two sections and one payload: the service's own details, and the `formFields`
   array embedded in the same document. There is no second model and no second
   request — the schema holds the fields inside the Service, and so does this.

   Required and format rules on the service's own details are the browser's own
   (`required`, `maxLength`), matching DepartmentForm and AgentForm. The field
   builder cannot use them: its inputs are inside cards that may be collapsed,
   and the browser cannot focus an input nobody can see. Those rules are checked
   in validateFormFields instead, and reported on the card. */

export function ServiceForm({ service, onSubmit, onCancel, saving = false }) {
  const editing = Boolean(service);

  const [form, setForm] = useState(() =>
    editing
      ? {
          name: service.name ?? '',
          shortDescription: service.shortDescription ?? '',
          description: service.description ?? '',
          department: service.department?._id ?? service.department ?? '',
          category: service.category?._id ?? service.category ?? '',
          applicationMode: service.applicationMode ?? 'online',
          status: service.status ?? 'inactive',
          fees: feesToForm(service.fees),
          timeline: timelineToForm(service),
          eligibility: eligibilityToForm(service.eligibility),
          requiredDocuments: [...(service.requiredDocuments ?? [])],
          faqs: faqsToForm(service.faqs),
        }
      : emptyServiceForm()
  );

  const [fields, setFields] = useState(() =>
    editing ? (service.formFields ?? []).map(formFieldToState) : []
  );

  // Errors are computed on every keystroke but only shown once the admin has
  // tried to submit. Marking a field red before it has been filled in is
  // telling someone off for not having finished typing.
  const [attempted, setAttempted] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const errors = useMemo(() => validateFormFields(fields), [fields]);
  const invalidCount = Object.keys(errors).length;

  /* The one rule the inputs cannot express themselves: fastest ≤ slowest is
     about two fields at once, so `min`/`max` on either of them cannot state it
     and the browser will not block the submit. */
  const timelineError = validateTimeline(form.timeline);

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    setAttempted(true);

    if (invalidCount > 0 || timelineError) return;

    onSubmit(editing ? buildServiceUpdate(form, fields) : buildServicePayload(form, fields));
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="form__lead">
        {editing
          ? 'Changing a field key after applications have been submitted orphans the answers already stored under the old one. Rename labels freely; rename keys deliberately.'
          : 'A service starts inactive — invisible to citizens — so the form can be built out and previewed before anyone can apply. Publishing is the last field on this page.'}
      </p>

      <ServiceBasicInfo form={form} onChange={set} />

      <ServiceFees fees={form.fees} onChange={(fees) => set('fees', fees)} />

      <ServiceTimeline
        timeline={form.timeline}
        onChange={(timeline) => set('timeline', timeline)}
      />

      <ServiceEligibility
        eligibility={form.eligibility}
        onChange={(eligibility) => set('eligibility', eligibility)}
      />

      <ServiceDocuments
        documents={form.requiredDocuments}
        onChange={(documents) => set('requiredDocuments', documents)}
      />

      {/* The documents above travel with it: a field that collects one should
          be named after it, so the builder offers them on the label. */}
      <FormFieldsBuilder
        fields={fields}
        errors={attempted ? errors : {}}
        documents={form.requiredDocuments}
        onChange={setFields}
      />

      <ServiceFaqs faqs={form.faqs} onChange={(faqs) => set('faqs', faqs)} />

      <ServicePublishing
        value={form.status}
        editing={editing}
        fieldCount={fields.length}
        onChange={(status) => set('status', status)}
      />

      {attempted && invalidCount > 0 && (
        <p className="notice notice--error" role="alert">
          <Icon name="alert" size={15} />
          {invalidCount} form field{invalidCount === 1 ? ' needs' : 's need'} attention — open the
          cards marked in red. Nothing has been sent.
        </p>
      )}

      <div className="form__actions">
        <button className="btn" type="button" disabled={saving} onClick={onCancel}>
          Cancel
        </button>
        <button className="btn" type="button" onClick={() => setPreviewing(true)}>
          <Icon name="eye" size={14} />
          Preview form
        </button>
        {/* Disabled while in flight — a second click would create a second
            service, and the derived slug is unique. */}
        <button className="btn btn--primary" type="submit" disabled={saving}>
          <Icon name={saving ? 'refresh' : 'check'} size={14} />
          {saving && (editing ? 'Saving…' : 'Creating…')}
          {!saving && (editing ? 'Save changes' : 'Create service')}
        </button>
      </div>

      {previewing && (
        <FormPreview
          serviceName={form.name}
          fields={fields}
          onClose={() => setPreviewing(false)}
        />
      )}
    </form>
  );
}

export default ServiceForm;
