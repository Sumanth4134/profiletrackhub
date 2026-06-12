import { Camera, Save, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getSessionProfile, updateAdminProfile } from '../../services/api';
import { getSession, saveSession } from '../../services/authSession';

export default function AdminProfile() {
  const [form, setForm] = useState({
    name: '',
    bio: '',
    photoUrl: ''
  });

  useEffect(() => {
    async function loadProfile() {
      const response = await getSessionProfile();
      const admin = response.data.admin;
      setForm({
        name: admin.name || '',
        bio: admin.bio || '',
        photoUrl: admin.photo_url || ''
      });
    }

    loadProfile();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    const response = await updateAdminProfile(form);
    const session = getSession();
    saveSession({
      token: session?.token || '',
      admin: response.data.admin
    });
    alert('Profile updated successfully.');
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading-row">
        <div>
          <h1 className="dashboard-page-title">Recruiter Profile</h1>
          <p className="dashboard-page-copy mb-0">
            Update your profile icon, name, and bio for the authenticated workspace.
          </p>
        </div>
      </div>

      <form className="reference-panel profile-panel" onSubmit={handleSave}>
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            {form.photoUrl ? (
              <img alt={form.name || 'Recruiter'} className="profile-avatar-image" src={form.photoUrl} />
            ) : (
              <div className="profile-avatar-fallback">
                <UserRound size={54} />
              </div>
            )}
          </div>

          <div className="profile-hero-copy">
            <h5 className="section-title mb-2">Workspace Identity</h5>
            <p className="section-copy mb-0">
              These details appear in the sidebar, header, and authenticated recruiter views.
            </p>
          </div>
        </div>

        <div className="row g-4 mt-2">
          <div className="col-md-6">
            <label className="reference-label">Name</label>
            <input
              className="form-control reference-input"
              placeholder="Enter recruiter name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>

          <div className="col-md-6">
            <label className="reference-label">Profile photo URL</label>
            <div className="input-group input-icon-left">
              <Camera className="input-icon" size={18} />
              <input
                className="form-control form-input"
                placeholder="https://example.com/photo.jpg"
                value={form.photoUrl}
                onChange={(event) => setForm({ ...form, photoUrl: event.target.value })}
              />
            </div>
          </div>

          <div className="col-12">
            <label className="reference-label">Bio</label>
            <textarea
              className="form-control form-textarea"
              placeholder="Write a short recruiter bio"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
          </div>
        </div>

        <div className="premium-form-actions">
          <button className="dashboard-action-btn primary" type="submit">
            <Save size={16} />
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
