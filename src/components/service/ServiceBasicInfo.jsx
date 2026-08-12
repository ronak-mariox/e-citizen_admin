import { useEffect, useState } from 'react';

import * as departmentsApi from '../../api/departments.js';
import * as servicesApi from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import {
  APPLICATION_MODES,
  DESCRIPTION_MAX,
  NAME_MAX,
  SHORT_DESCRIPTION_MAX,
} from '../../constants/serviceForm.js';

/* The service itself — everything that is not a form field.

   Departments are fetched here rather than passed in, the same way AgentForm
   does it: the two selects are the only things that need them, and a parent
   that fetched on their behalf would have to be told when they changed.

   Only active departments are offered — the API refuses a service filed under
   an inactive one, so listing them would be listing a choice that cannot be
   saved. */

const isUsable = (department) => department.status === 'active';

export function ServiceBasicInfo({ form, onChange }) {
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState(null);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;

    // MAX_LIMIT on the API. A dropdown that silently stops at 20 would hide
    // departments an admin knows exist, which reads as a bug in the list.
    departmentsApi
      .listDepartments({ limit: 100 })
      .then((data) => {
        if (!cancelled) setDepartments(data.departments.filter(isUsable));
      })
      .catch((error) => {
        if (!cancelled) setDepartmentError(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoadingDepartments(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Categories are optional in the schema and the endpoint behind them does not
     exist yet, so a failure here is not worth a message: the select simply says
     there are none to choose from. */
  useEffect(() => {
    let cancelled = false;

    servicesApi
      .listServiceCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="form__group">
      <h2 className="form__group-title">Service information</h2>
      <p className="form__group-hint">
        What the citizen sees in the catalogue, and which department the application is filed with.
      </p>

      <div className="form__grid">
        <label className="field2 field2--full">
          <span className="field2__label">Service name *</span>
          <input
            className="field2__input"
            value={form.name}
            maxLength={NAME_MAX}
            placeholder="Enter the service name"
            required
            onChange={(event) => onChange('name', event.target.value)}
          />
          <span className="field2__hint">
            The web address is derived from this by the API — /services/birth-certificate.
          </span>
        </label>

        <label className="field2 field2--full">
          <span className="field2__label">Short description</span>
          <input
            className="field2__input"
            value={form.shortDescription}
            maxLength={SHORT_DESCRIPTION_MAX}
            placeholder="Enter a one-line description"
            onChange={(event) => onChange('shortDescription', event.target.value)}
          />
          <span className="field2__hint">One line, shown on the catalogue card.</span>
        </label>

        <label className="field2 field2--full">
          <span className="field2__label">Description</span>
          <textarea
            className="field2__input field2__input--area"
            value={form.description}
            maxLength={DESCRIPTION_MAX}
            rows={4}
            placeholder="Describe the service for the citizen"
            onChange={(event) => onChange('description', event.target.value)}
          />
          <span className="field2__hint">Shown on the service detail page.</span>
        </label>

        <label className="field2">
          <span className="field2__label">Department *</span>
          <select
            className="field2__input"
            value={form.department}
            required
            disabled={loadingDepartments || Boolean(departmentError)}
            onChange={(event) => onChange('department', event.target.value)}
          >
            <option value="">{loadingDepartments ? 'Loading departments…' : 'Select…'}</option>
            {departments.map((department) => (
              <option value={department._id} key={department._id}>
                {department.name} ({department.code})
              </option>
            ))}
          </select>

          {departmentError && (
            <span className="field2__hint field2__hint--error">
              Could not load departments — {departmentError}
            </span>
          )}
          {!loadingDepartments && !departmentError && departments.length === 0 && (
            <span className="field2__hint field2__hint--error">
              No departments exist yet. Create one under Departments first — a service cannot exist
              without the body that owns it.
            </span>
          )}
          {!loadingDepartments && !departmentError && departments.length > 0 && (
            <span className="field2__hint">Decides who the application is ultimately filed with.</span>
          )}
        </label>

        <label className="field2">
          <span className="field2__label">Category</span>
          <select
            className="field2__input"
            value={form.category}
            disabled={categories.length === 0}
            onChange={(event) => onChange('category', event.target.value)}
          >
            <option value="">{categories.length === 0 ? 'None configured' : 'Select…'}</option>
            {categories.map((category) => (
              <option value={category._id} key={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <span className="field2__hint">
            Optional — how the service is grouped for browsing.
          </span>
        </label>

        <label className="field2">
          <span className="field2__label">Application mode</span>
          <select
            className="field2__input"
            value={form.applicationMode}
            onChange={(event) => onChange('applicationMode', event.target.value)}
          >
            {APPLICATION_MODES.map((mode) => (
              <option value={mode.value} key={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
          <span className="field2__hint">
            An offline service still collects these fields — it is filed by hand afterwards.
          </span>
        </label>
      </div>
    </section>
  );
}

export default ServiceBasicInfo;
