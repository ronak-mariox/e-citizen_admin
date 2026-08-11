import { useState } from 'react';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Icon from '../components/dashboard/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as adminsApi from '../api/admins.js';
import { getErrorMessage } from '../api/client.js';
import { displayName, initialsOf } from '../utils/format.js';

/* The signed-in admin's own account.

   Three editable fields, which is all the API accepts: the email is the login
   identifier, the password has its own route, and role, permissions and status
   are privileges rather than profile fields. The rest of the page states them
   read-only, because "what am I allowed to do here" is a fair question to ask
   of a profile screen even when the answer is not yours to change.

   Saving writes the returned account straight back into the session, so the
   sidebar and the top bar repaint with the new name without a reload. */

const NAME_MAX = 120;
const DESIGNATION_MAX = 120;

export function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState(() => ({
    fullName: user?.fullName ?? '',
    designation: user?.designation ?? '',
    mobile: user?.mobile ?? '',
  }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(null);

    try {
      const updated = await adminsApi.updateMyAccount({
        fullName: form.fullName.trim(),
        designation: form.designation.trim(),
        mobile: form.mobile.trim(),
      });

      updateUser(updated);
      setSaved('Your details were saved.');
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  // What the shell will call you once this is saved — the same helper the
  // sidebar and top bar use, so the preview cannot disagree with them.
  const preview = displayName({ ...user, fullName: form.fullName });

  return (
    <DashboardLayout>
      <main className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">My profile</h1>
            <p className="page__subtitle">
              Your name is what the console calls you, and what the audit trail records against
              everything you do here
            </p>
          </div>
        </div>

        {saved && (
          <p className="notice">
            <Icon name="check" size={15} />
            {saved}
          </p>
        )}

        {error && (
          <p className="notice notice--error" role="alert">
            <Icon name="alert" size={15} />
            {error}
          </p>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <section className="form__group">
            <div className="profile__head">
              <span className="profile__avatar" aria-hidden="true">
                {initialsOf(preview)}
              </span>
              <div>
                <p className="profile__name">{preview}</p>
                <p className="profile__meta">{form.designation.trim() || 'Administrator'}</p>
              </div>
            </div>

            <div className="form__grid">
              <label className="field2">
                <span className="field2__label">Full name</span>
                <input
                  className="field2__input"
                  value={form.fullName}
                  maxLength={NAME_MAX}
                  placeholder="Enter your full name"
                  onChange={(event) => set('fullName', event.target.value)}
                />
                <span className="field2__hint">
                  Shown in the sidebar, the top bar and every audit entry you leave behind.
                </span>
              </label>

              <label className="field2">
                <span className="field2__label">Designation</span>
                <input
                  className="field2__input"
                  value={form.designation}
                  maxLength={DESIGNATION_MAX}
                  placeholder="Enter your designation"
                  onChange={(event) => set('designation', event.target.value)}
                />
                <span className="field2__hint">
                  The line under your name. Optional — “Admin” stands in when it is empty.
                </span>
              </label>

              <label className="field2">
                <span className="field2__label">Mobile</span>
                <input
                  className="field2__input"
                  type="tel"
                  value={form.mobile}
                  maxLength={10}
                  placeholder="Enter your 10-digit mobile number"
                  onChange={(event) => set('mobile', event.target.value.replace(/\D/g, ''))}
                />
                <span className="field2__hint">
                  Not a login credential — it is where a password-reset code is sent.
                </span>
              </label>
            </div>
          </section>

          {/* Stated, not offered. Changing any of these from a profile form
              would be a privilege-escalation route wearing a friendly hat, and
              the API refuses them for the same reason. */}
          <section className="form__group">
            <h2 className="form__group-title">Account</h2>
            <p className="form__group-hint">
              Set when the account was created. Email and password are credentials; the rest are
              privileges another admin grants.
            </p>

            <div className="form__grid">
              <div className="field2">
                <span className="field2__label">Email</span>
                <p className="field2__static">{user?.email ?? '—'}</p>
                <span className="field2__hint">The address you sign in with.</span>
              </div>

              <div className="field2">
                <span className="field2__label">Role</span>
                <p className="field2__static">
                  {user?.isSuperAdmin ? 'Super admin' : 'Admin'}
                </p>
                <span className="field2__hint">
                  {user?.isSuperAdmin
                    ? 'Holds every permission, and is the only role that may create admins.'
                    : 'Full back office, minus creating other admins.'}
                </span>
              </div>

              <div className="field2">
                <span className="field2__label">Password</span>
                <p className="field2__static">••••••••</p>
                <span className="field2__hint">
                  Changing it signs out every device, including this one.
                </span>
              </div>
            </div>
          </section>

          <div className="form__actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              <Icon name={saving ? 'refresh' : 'check'} size={14} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </main>
    </DashboardLayout>
  );
}

export default ProfilePage;
