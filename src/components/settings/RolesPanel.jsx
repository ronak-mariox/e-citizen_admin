import Icon from '../dashboard/Icon.jsx';
import PanelCard from './PanelCard.jsx';
import { ADMINS, AGENTS, CITIZENS } from '../../constants/records.js';
import { PERMISSION_CATALOG, PLATFORM_ROLES } from '../../constants/settings.js';
import { count } from '../../utils/format.js';

/* Roles and permissions.

   Two questions, two cards. The first is "what roles exist and what is each
   one for" — four of them, fixed in backend/src/constants/roles.js, because a
   role decides which of the four apps a sign-in opens and a fifth would need an
   app to open into. Admin is the top of that list; nothing sits above it.

   The second is "what does Admin actually mean" — the ten capabilities the role
   is made of. Spelling them out is the point: "full access" is a claim, this
   table is the list behind it. */

const accountsInRole = (role) => {
  if (role === 'admin') return ADMINS.length;
  if (role === 'agent_1') return AGENTS.filter((agent) => agent.level === 'l1').length;
  if (role === 'agent_2') return AGENTS.filter((agent) => agent.level === 'l2').length;
  return CITIZENS.length;
};

export function RolesPanel() {
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
          title="Admin permissions"
          count={PERMISSION_CATALOG.length}
          subtitle={`What the Admin role is made of. All ${PERMISSION_CATALOG.length} are held by every one of the ${ADMINS.length} administrator accounts.`}
          flush
        >
          <div className="card__bleed">
            <div className="table__overflow">
              <div className="table table--permissions" role="table">
                <div className="table__head" role="row">
                  <div role="columnheader">Permission</div>
                  <div role="columnheader">What it grants</div>
                  <div role="columnheader">Section</div>
                  <div role="columnheader">Held by</div>
                </div>

                {PERMISSION_CATALOG.map((permission) => {
                  const holders = ADMINS.filter((admin) =>
                    admin.permissions.includes(permission.value)
                  );

                  return (
                    <div className="table__row" role="row" key={permission.value}>
                      <div className="table__cell" role="cell">
                        <span className="perm">
                          <span className="perm__icon">
                            <Icon name="key" size={14} />
                          </span>
                          <span className="perm__body">
                            <span className="perm__label">{permission.label}</span>
                            <span className="perm__value">{permission.value}</span>
                          </span>
                        </span>
                      </div>

                      <div className="table__cell table__muted" role="cell">
                        {permission.grants}
                      </div>

                      <div className="table__cell" role="cell">
                        <span className="tag tag--slate">{permission.section}</span>
                      </div>

                      <div className="table__cell" role="cell">
                        {holders.length === ADMINS.length ? (
                          <span className="tag tag--violet">Every admin</span>
                        ) : (
                          <span className="perm__none">
                            {holders.length} of {ADMINS.length}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </PanelCard>
      </div>
    </>
  );
}

export default RolesPanel;
