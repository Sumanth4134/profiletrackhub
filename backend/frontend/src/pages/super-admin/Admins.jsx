import { Eye, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getSuperAdminsList, resetAdminPassword, updateAdminAccount } from '../../services/api';

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [query, setQuery] = useState('');

  const loadAdmins = async () => {
    const response = await getSuperAdminsList();
    setAdmins(response.data || []);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const filteredAdmins = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return admins;
    }

    return admins.filter((admin) =>
      [admin.name, admin.phone, admin.status].some((value) => String(value || '').toLowerCase().includes(term))
    );
  }, [admins, query]);

  const handleToggleStatus = async (admin) => {
    await updateAdminAccount(admin.id, {
      name: admin.name,
      phone: admin.phone,
      status: admin.status === 'active' ? 'inactive' : 'active',
      bio: admin.bio || ''
    });
    loadAdmins();
  };

  const handleResetPassword = async (adminId) => {
    const response = await resetAdminPassword(adminId);
    alert(`New password: ${response.data.generatedPassword}`);
    loadAdmins();
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading-row">
        <div>
          <h1 className="dashboard-page-title">All Recruiters</h1>
          <p className="dashboard-page-copy mb-0">View, search, deactivate, and reset access for every recruiter account.</p>
        </div>
      </div>

      <div className="reference-panel">
        <label className="reference-label">Search recruiters</label>
        <div className="input-group input-icon-right">
          <input
            className="form-control form-input"
            placeholder="Search by name, phone, or status"
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
                <th>Recruiter Name</th>
                <th>Phone</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>No. of Jobs</th>
                <th>No. of Profiles</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td className="fw-semibold">{admin.name}</td>
                  <td>{admin.phone}</td>
                  <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-pill ${admin.status === 'active' ? 'status-selected' : 'status-interview'}`}>
                      {admin.status}
                    </span>
                  </td>
                  <td>{admin.jobs_count}</td>
                  <td>{admin.profiles_count}</td>
                  <td>
                    <div className="jobs-table-actions">
                      <button className="table-icon-action edit" title="View" type="button">
                        <Eye size={15} />
                      </button>
                      <button className="table-icon-action toggle" onClick={() => handleToggleStatus(admin)} title="Deactivate / Activate" type="button">
                        <ShieldCheck size={15} />
                      </button>
                      <button className="table-icon-action delete" onClick={() => handleResetPassword(admin.id)} title="Reset Password" type="button">
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-5" colSpan="7">
                    No recruiters matched your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
