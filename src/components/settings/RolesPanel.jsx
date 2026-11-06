import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Icon from '../dashboard/Icon.jsx';
import PanelCard from './PanelCard.jsx';
import { ADMINS, AGENTS, CITIZENS } from '../../constants/records.js';
import { PLATFORM_ROLES } from '../../constants/settings.js';
import * as rolePermissionsApi from '../../api/rolePermissions.js';
import { getErrorMessage } from '../../api/client.js';
import { useLiveRefresh } from '../../hooks/useLiveRefresh.js';
import { count } from '../../utils/format.js';

/* Roles and permissions.

   Two questions, two cards. The first is "what roles exist and what is each
   one for" — four of them, fixed in backend/src/constants/roles.js, because a
   role decides which of the four apps a sign-in opens and a fifth would need
   an app to open into. Admin is the top of that list; nothing sits above it.

   The second is "what may each role actually do" — a real, per-role
   checklist read from and saved to backend/src/constants/permissions.js's
   catalog (GET/PATCH /admins/role-permissions). Agent 1, Agent 2 and Citizen
   are enforced immediately: an unchecked box here 403s the matching route
   the moment it is saved (see backend/src/middlewares/role.middleware.js's
   requireRolePermission). Admin's own list stays visible and editable for
   completeness, but nothing on the admin console reads it yet — there is no
   tier above Admin to gate it behind. */

const accountsInRole = (role) => {
  if (role === 'admin') return ADMINS.length;
  if (role === 'agent_1') return AGENTS.filter((agent) => agent.level === 'l1').length;
  if (role === 'agent_2') return AGENTS.filter((agent) => agent.level === 'l2').length;
  return CITIZENS.length;
};

/** A role's catalog, grouped into its sections in first-seen order — the
    catalog itself is already grouped, this only reshapes it for rendering. */
const sectioned = (catalog) => {
  const sections = [];

  for (const entry of catalog) {
    let section = sections.find((candidate) => candidate.title === entry.section);
    if (!section) {
      section = { title: entry.section, entries: [] };
      sections.push(section);
    }
    section.entries.push(entry);
  }

  return sections;
};

const sameKeys = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

export function RolesPanel() {
  const [params, setParams] = useSearchParams();
  const selectedRole = PLATFORM_ROLES.some((role) => role.value === params.get('role'))
    ? params.get('role')
    : PLATFORM_ROLES[0].value;

  const selectRole = (next) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('role', next);
    setParams(nextParams);
  };

  const [roles, setRoles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Every role's edits live here at once, keyed by role, so switching the
  // sub-tab does not throw away an unsaved change on the role left behind.
  const [draft, setDraft] = useState({});

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(null);

  /* Another admin's save arrives as a live refetch. It updates every role
     whose checklist is untouched here; one with unsaved edits keeps them.
     `loaded` is what the server last said, per role — the baseline for that. */
  const [reloadToken, setReloadToken] = useState(0);
  useLiveRefresh(() => setReloadToken((token) => token + 1), ['permissions']);
  const loaded = useRef({});

  useEffect(() => {
    let cancelled = false;
    const quiet = reloadToken > 0;

    rolePermissionsApi
      .getAllRolePermissions()
      .then((data) => {
        if (cancelled) return;

        const before = loaded.current;
        loaded.current = Object.fromEntries(data.map((row) => [row.role, row.permissions]));

        setRoles(data);
        setLoadError(null);
        setDraft((prev) =>
          Object.fromEntries(
            data.map((row) => {
              const mine = prev[row.role];
              const edited = mine && before[row.role] && !sameKeys(mine, before[row.role]);
              return [row.role, edited ? mine : row.permissions];
            })
          )
        );
      })
      .catch((failure) => {
        // A failed live refetch keeps the checklist already on screen.
        if (!cancelled && !quiet) setLoadError(getErrorMessage(failure));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const current = roles?.find((row) => row.role === selectedRole);
  const draftPermissions = draft[selectedRole] ?? [];
  const isDirty = current ? !sameKeys(draftPermissions, current.permissions) : false;

  const togglePermission = (key) => {
    setSaved(null);
    setDraft((prev) => {
      const list = prev[selectedRole] ?? [];
      const next = list.includes(key) ? list.filter((item) => item !== key) : [...list, key];
      return { ...prev, [selectedRole]: next };
    });
  };

  const discardDraft = () => {
    if (!current) return;
    setSaveError(null);
    setSaved(null);
    setDraft((prev) => ({ ...prev, [selectedRole]: current.permissions }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(null);

    try {
      const updated = await rolePermissionsApi.updateRolePermissions(selectedRole, draftPermissions);
      setRoles((prev) => prev.map((row) => (row.role === selectedRole ? updated : row)));
      setDraft((prev) => ({ ...prev, [selectedRole]: updated.permissions }));
      loaded.current = { ...loaded.current, [selectedRole]: updated.permissions };

      const roleLabel = PLATFORM_ROLES.find((role) => role.value === selectedRole)?.label;
      setSaved(`Saved — ${roleLabel} now has ${updated.permissions.length} of ${updated.catalog.length} permissions.`);
    } catch (failure) {
      setSaveError(getErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PanelCard
        title="Roles"
        count={PLATFORM_ROLES.length}
        subtitle="Fixed in code — a role decides which app an account signs in to, so they are not created here"
        flush
      >
        <div className="card__bleed">
          <div className="table__overflow">
            <div className="table table--roles" role="table">
              <div className="table__head" role="row">
                <div role="columnheader">Role</div>
                <div role="columnheader">Signs in to</div>
                <div role="columnheader">What it covers</div>
                <div role="columnheader">Accounts</div>
              </div>

              {PLATFORM_ROLES.map((role) => (
                <div className="table__row" role="row" key={role.value}>
                  <div className="table__cell" role="cell">
                    <span className="perm">
                      <span className={`perm__icon perm__icon--${role.tone}`}>
                        <Icon name="shield" size={14} />
                      </span>
                      <span className="perm__body">
                        <span className="perm__label">{role.label}</span>
                        <span className="perm__value">{role.value}</span>
                      </span>
                    </span>
                  </div>

                  <div className="table__cell table__muted table__truncate" role="cell">
                    {role.console}
                  </div>

                  <div className="table__cell table__muted" role="cell">
                    {role.summary}
                  </div>

                  <div className="table__cell" role="cell">
                    {count(accountsInRole(role.value))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PanelCard>

      <div className="config-group">
        <PanelCard
          title="Permissions"
          subtitle="What each role may do. Uncheck one and save — Agent 1, Agent 2 and Citizen are enforced immediately."
        >
          <div className="role-subtabs" role="tablist" aria-label="Role">
            {PLATFORM_ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                role="tab"
                aria-selected={role.value === selectedRole}
                className={`settings-tab role-subtab ${role.value === selectedRole ? 'settings-tab--active' : ''}`}
                onClick={() => selectRole(role.value)}
              >
                <Icon name="shield" size={14} />
                {role.label}
              </button>
            ))}
          </div>

          {loading && (
            <p className="notice">
              <Icon name="refresh" size={15} />
              Reading current permissions…
            </p>
          )}

          {loadError && (
            <p className="notice notice--error" role="alert">
              {loadError}
            </p>
          )}

          {!loading && !loadError && current && (
            <>
              {selectedRole === 'admin' && (
                <p className="notice notice--info">
                  <Icon name="shield" size={14} />
                  Not enforced yet — every admin account keeps full access regardless of what is
                  unchecked here. This list is for reference until Admin's own routes are gated too.
                </p>
              )}

              {sectioned(current.catalog).map((section) => (
                <div className="role-perm-section" key={section.title}>
                  <h4 className="role-perm-section__title">{section.title}</h4>

                  <div className="status-options">
                    {section.entries.map((entry) => {
                      const granted = draftPermissions.includes(entry.key);

                      return (
                        <label
                          className={granted ? 'status-option status-option--on' : 'status-option'}
                          key={entry.key}
                        >
                          <input type="checkbox" checked={granted} onChange={() => togglePermission(entry.key)} />
                          <span className="status-option__body">
                            <span className="perm__label">{entry.label}</span>
                            <span className="status-option__hint">{entry.grants}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {saveError && (
                <p className="notice notice--error" role="alert">
                  {saveError}
                </p>
              )}

              {saved && !isDirty && (
                <p className="notice" role="status">
                  <Icon name="check" size={15} />
                  {saved}
                </p>
              )}

              <div className="form__actions">
                <button className="btn" type="button" disabled={!isDirty || saving} onClick={discardDraft}>
                  Discard changes
                </button>
                <button className="btn btn--primary" type="button" disabled={!isDirty || saving} onClick={handleSave}>
                  <Icon name="save" size={14} />
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </>
          )}
        </PanelCard>
      </div>
    </>
  );
}

export default RolesPanel;
