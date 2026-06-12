import {
  ClipboardCopy,
  KeyRound,
  LogOut,
  Phone,
  RotateCcw,
  ShieldPlus,
  UserPlus
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  changePassword,
  createAdminAccount,
  getPasswordRequests,
  logout,
  resolvePasswordRequest,
  resetAdminPassword
} from '../../services/api';
import { clearSession, getCurrentAdmin } from '../../services/authSession';

export default function SettingsPage() {
  const navigate = useNavigate();
  const admin = getCurrentAdmin();
  const isSuperAdmin = admin?.role === 'super_admin';
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [adminForm, setAdminForm] = useState({
    name: '',
    phone: ''
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    if (!isSuperAdmin) {
      return;
    }

    const response = await getPasswordRequests();
    setRequests(response.data || []);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handlePasswordSave = async (event) => {
    event.preventDefault();

    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirm password must match.');
      return;
    }

    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });

    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    alert('Password updated successfully.');
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    const response = await createAdminAccount(adminForm);
    setGeneratedPassword(response.data.generatedPassword || '');
    setAdminForm({ name: '', phone: '' });
    alert('Recruiter account created.');
  };

  const handleResolveRequest = async (requestId) => {
    await resolvePasswordRequest(requestId);
    loadRequests();
  };

  const handleResetPassword = async (adminId) => {
    const response = await resetAdminPassword(adminId);
    setGeneratedPassword(response.data.generatedPassword || '');
    alert('Recruiter password reset successfully.');
    loadRequests();
  };

  const handleCopyPassword = async () => {
    if (!generatedPassword) {
      return;
    }

    await navigator.clipboard.writeText(generatedPassword);
    alert('Password copied.');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_error) {
      // ignore logout transport issues
    } finally {
      clearSession();
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading-row">
        <div>
          <h1 className="dashboard-page-title">{isSuperAdmin ? 'Super Admin Settings' : 'Recruiter Settings'}</h1>
          <p className="dashboard-page-copy mb-0">
            {isSuperAdmin
              ? 'Manage recruiter accounts, password requests, and super admin security from one place.'
              : 'Update your password and manage your authenticated workspace session.'}
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="reference-panel">
          <div className="settings-card-header">
            <div className="settings-card-icon tone-blue">
              <KeyRound size={18} />
            </div>
            <div>
              <h5 className="section-title mb-1">Change Password</h5>
              <p className="section-copy mb-0">Update your current account password.</p>
            </div>
          </div>

          <form className="mt-4" onSubmit={handlePasswordSave}>
            <div className="row g-3">
              <div className="col-12">
                <label className="reference-label">Old password</label>
                <input
                  className="form-control reference-input"
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, oldPassword: event.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="reference-label">New password</label>
                <input
                  className="form-control reference-input"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="reference-label">Confirm password</label>
                <input
                  className="form-control reference-input"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                />
              </div>
            </div>

            <button className="dashboard-action-btn primary mt-4" type="submit">
              <KeyRound size={16} />
              <span>Update Password</span>
            </button>
          </form>
        </div>

        {isSuperAdmin ? (
          <div className="reference-panel">
            <div className="settings-card-header">
              <div className="settings-card-icon tone-green">
                <UserPlus size={18} />
              </div>
              <div>
                <h5 className="section-title mb-1">Create Recruiter Account</h5>
                <p className="section-copy mb-0">Recruiters cannot self-register. Create them here and share the password once.</p>
              </div>
            </div>

            <form className="mt-4" onSubmit={handleCreateAdmin}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="reference-label">Recruiter name</label>
                  <input
                    className="form-control reference-input"
                    value={adminForm.name}
                    onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="reference-label">Phone number</label>
                  <input
                    className="form-control reference-input"
                    value={adminForm.phone}
                    onChange={(event) => setAdminForm({ ...adminForm, phone: event.target.value })}
                  />
                </div>
              </div>

              {generatedPassword ? (
                <div className="jobs-link-box premium-link-card mt-4">
                  <div className="jobs-link-title">Generated Password</div>
                  <div className="jobs-link-copy">{generatedPassword}</div>
                  <div className="jobs-link-actions">
                    <button className="dashboard-action-btn white" onClick={handleCopyPassword} type="button">
                      <ClipboardCopy size={16} />
                      <span>Copy Password</span>
                    </button>
                  </div>
                </div>
              ) : null}

              <button className="dashboard-action-btn success mt-4" type="submit">
                <ShieldPlus size={16} />
                <span>Save Recruiter</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="reference-panel">
            <div className="settings-card-header">
              <div className="settings-card-icon tone-green">
                <Phone size={18} />
              </div>
              <div>
                <h5 className="section-title mb-1">Password Support</h5>
                <p className="section-copy mb-0">If you lose access, use the login screen request password action for super admin support.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isSuperAdmin ? (
        <div className="reference-table-card">
          <div className="saved-jobs-head">
            <div>
              <h5 className="section-title mb-1">Password Requests</h5>
              <p className="section-copy mb-0">Review recruiter reset requests and generate new passwords when needed.</p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table reference-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Recruiter</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.admin_name || 'Unknown Recruiter'}</td>
                    <td>{request.phone}</td>
                    <td>
                      <span className={`status-pill ${request.status === 'resolved' ? 'status-selected' : 'status-amber'}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>{new Date(request.created_at).toLocaleString()}</td>
                    <td>
                      <div className="jobs-table-actions">
                        <button className="table-icon-action edit" onClick={() => handleResetPassword(request.admin_id)} type="button">
                          <RotateCcw size={15} />
                        </button>
                        <button className="table-icon-action toggle" onClick={() => handleResolveRequest(request.id)} type="button">
                          <ShieldPlus size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 ? (
                  <tr>
                    <td className="text-center text-muted py-5" colSpan="5">
                      No password requests yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="reference-panel">
        <div className="settings-card-header">
          <div className="settings-card-icon tone-purple">
            <LogOut size={18} />
          </div>
          <div>
            <h5 className="section-title mb-1">Logout</h5>
            <p className="section-copy mb-0">End the current authenticated session and return to the recruiter login page.</p>
          </div>
        </div>

        <button className="dashboard-action-btn white mt-4" onClick={handleLogout} type="button">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
