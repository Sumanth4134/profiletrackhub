import { Eye, RotateCcw, Search, ShieldCheck, UserCog, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getCurrentAdmin } from '../../services/authSession';
import {
  getSuperAdminsList,
  resetAdminPassword,
  updateAdminAccount,
  updateAdminRole
} from '../../services/api';

function getRoleLabel(role) {
  return role === 'super_admin' ? 'Super Admin' : 'Recruiter';
}

export default function AdminsPage() {
  const currentAdmin = getCurrentAdmin();
  const [admins, setAdmins] = useState([]);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState(null);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [submittingRoleChange, setSubmittingRoleChange] = useState(false);

  const loadAdmins = async () => {
    const response = await getSuperAdminsList();
    setAdmins(response.data || []);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timerId = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timerId);
  }, [notice]);

  const filteredAdmins = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return admins;
    }

    return admins.filter((admin) =>
      [admin.name, admin.email, admin.phone, admin.status, getRoleLabel(admin.role)].some((value) =>
        String(value || '').toLowerCase().includes(term)
      )
    );
  }, [admins, query]);

  const handleToggleStatus = async (admin) => {
    try {
      await updateAdminAccount(admin.id, {
        name: admin.name,
        phone: admin.phone,
        status: admin.status === 'active' ? 'inactive' : 'active',
        bio: admin.bio || ''
      });
      setNotice({
        type: 'success',
        message: `${admin.name} is now ${admin.status === 'active' ? 'inactive' : 'active'}.`
      });
      loadAdmins();
    } catch (error) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.error || 'Unable to update admin status.'
      });
    }
  };

  const handleResetPassword = async (adminId) => {
    try {
      const response = await resetAdminPassword(adminId);
      alert(`New password: ${response.data.generatedPassword}`);
      setNotice({
        type: 'success',
        message: 'Password reset successfully.'
      });
      loadAdmins();
    } catch (error) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.error || 'Unable to reset password.'
      });
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) {
      return;
    }

    try {
      setSubmittingRoleChange(true);
      await updateAdminRole(pendingRoleChange.id, pendingRoleChange.nextRole);
      setNotice({
        type: 'success',
        message: `${pendingRoleChange.name} is now a ${getRoleLabel(pendingRoleChange.nextRole)}.`
      });
      setPendingRoleChange(null);
      loadAdmins();
    } catch (error) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.error || 'Unable to update admin role.'
      });
    } finally {
      setSubmittingRoleChange(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading-row">
        <div>
          <h1 className="dashboard-page-title">All Admins</h1>
          <p className="dashboard-page-copy mb-0">
            View every recruiter and super admin, manage status, and update role access without changing existing routes.
          </p>
        </div>
      </div>

      {notice ? <div className={`inline-toast ${notice.type === 'error' ? 'error' : 'success'}`}>{notice.message}</div> : null}

      <div className="reference-panel">
        <label className="reference-label">Search admins</label>
        <div className="input-group input-icon-right">
          <input
            className="form-control form-input"
            placeholder="Search by name, role, phone, or status"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Search className="input-icon" size={18} />
        </div>
      </div>

      <div className="reference-table-card">
        <div className="table-responsive">
          <table className="table reference-table align-middle mb-0">
            <thead>
              <tr>
                <th>Admin Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Current Role</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>No. of Jobs</th>
                <th>No. of Profiles</th>
                <th>Role Action</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => {
                const isCurrentUser = currentAdmin?.id === admin.id;
                const isSuperAdminRow = admin.role === 'super_admin';
                const nextRole = admin.role === 'super_admin' ? 'recruiter' : 'super_admin';

                return (
                  <tr key={admin.id}>
                    <td className="fw-semibold">{admin.name}</td>
                    <td>{admin.email || '-'}</td>
                    <td>{admin.phone}</td>
                    <td>
                      <span className={`status-pill ${admin.role === 'super_admin' ? 'status-shortlisted' : 'status-selected'}`}>
                        {getRoleLabel(admin.role)}
                      </span>
                    </td>
                    <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-pill ${admin.status === 'active' ? 'status-selected' : 'status-interview'}`}>
                        {admin.status}
                      </span>
                    </td>
                    <td>{admin.jobs_count}</td>
                    <td>{admin.profiles_count}</td>
                    <td>
                      {isCurrentUser ? (
                        <span className="table-role-note">Current user</span>
                      ) : (
                        <button
                          className="table-role-action"
                          onClick={() =>
                            setPendingRoleChange({
                              id: admin.id,
                              name: admin.name,
                              currentRole: admin.role,
                              nextRole
                            })
                          }
                          type="button"
                        >
                          <UserCog size={15} />
                          <span>{admin.role === 'super_admin' ? 'Make Recruiter' : 'Make Super Admin'}</span>
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="jobs-table-actions">
                        <button className="table-icon-action edit" title="View" type="button">
                          <Eye size={15} />
                        </button>
                        {!isCurrentUser && !isSuperAdminRow ? (
                          <>
                            <button
                              className="table-icon-action toggle"
                              onClick={() => handleToggleStatus(admin)}
                              title="Deactivate / Activate"
                              type="button"
                            >
                              <ShieldCheck size={15} />
                            </button>
                            <button
                              className="table-icon-action delete"
                              onClick={() => handleResetPassword(admin.id)}
                              title="Reset Password"
                              type="button"
                            >
                              <RotateCcw size={15} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-5" colSpan="10">
                    No admins matched your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {pendingRoleChange ? (
        <div className="confirmation-overlay" role="presentation" onClick={() => !submittingRoleChange && setPendingRoleChange(null)}>
          <div
            aria-modal="true"
            className="confirmation-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="confirmation-modal-head">
              <div>
                <h5 className="section-title mb-1">Confirm Role Change</h5>
                <p className="section-copy mb-0">
                  {pendingRoleChange.nextRole === 'super_admin'
                    ? `Promote ${pendingRoleChange.name} to Super Admin?`
                    : `Demote ${pendingRoleChange.name} to Recruiter?`}
                </p>
              </div>
              <button
                className="confirmation-close-btn"
                onClick={() => !submittingRoleChange && setPendingRoleChange(null)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="confirmation-modal-body">
              <div className="confirmation-summary-row">
                <span>Current role</span>
                <strong>{getRoleLabel(pendingRoleChange.currentRole)}</strong>
              </div>
              <div className="confirmation-summary-row">
                <span>New role</span>
                <strong>{getRoleLabel(pendingRoleChange.nextRole)}</strong>
              </div>
            </div>

            <div className="confirmation-modal-actions">
              <button
                className="dashboard-action-btn white"
                onClick={() => setPendingRoleChange(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="dashboard-action-btn primary"
                onClick={handleConfirmRoleChange}
                type="button"
              >
                {submittingRoleChange ? 'Updating...' : 'Confirm Role Change'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
