import { Download, ExternalLink, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { deleteSuperAdminProfile, getSuperAdminProfiles } from '../../services/api';
import { downloadWorkbook } from '../../services/exportExcel';
import { getAssetUrl } from '../../services/runtime';

const statusToneMap = {
  New: 'status-new',
  'Interview Process': 'status-interview',
  Shortlisted: 'status-shortlisted',
  Selected: 'status-selected'
};

export default function SuperAdminProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  const loadProfiles = async () => {
    const response = await getSuperAdminProfiles();
    setProfiles(response.data || []);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch = !filters.search || [profile.full_name, profile.job_title, profile.admin_name]
        .some((value) => String(value || '').toLowerCase().includes(filters.search.toLowerCase()));
      const matchesStatus = !filters.status || profile.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [filters, profiles]);

  const handleExport = () => {
    downloadWorkbook({
      sheetName: 'All Profiles',
      rows: filteredProfiles,
      fileName: 'profiletrackhub-all-profiles.xlsx'
    });
  };

  const handleDelete = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) {
      return;
    }

    await deleteSuperAdminProfile(profileId);
    await loadProfiles();
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading-row">
        <div>
          <h1 className="dashboard-page-title">All Profiles</h1>
          <p className="dashboard-page-copy mb-0">Review every candidate application submitted across all recruiters and public job links.</p>
        </div>
        <div className="dashboard-actions">
          <button className="dashboard-action-btn white" onClick={handleExport} type="button">
            <Download size={16} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="reference-panel">
        <div className="row g-3 align-items-end">
          <div className="col-md-8">
            <label className="reference-label">Search profiles</label>
            <div className="reference-input-wrap">
              <input
                className="form-control reference-input pe-5"
                placeholder="Search by candidate, job, or admin"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              />
              <Search className="reference-input-icon" size={18} />
            </div>
          </div>
          <div className="col-md-4">
            <label className="reference-label">Status</label>
            <select
              className="form-select reference-input"
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            >
              <option value="">All Status</option>
              <option value="New">New</option>
              <option value="Interview Process">Interview Process</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Selected">Selected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="reference-table-card">
        <div className="table-responsive">
          <table className="table reference-table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Recruiter</th>
                <th>Job Title</th>
                <th>Status</th>
                <th>Resume</th>
                <th>LinkedIn</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="fw-semibold">{profile.full_name}</td>
                  <td>{profile.admin_name || '—'}</td>
                  <td>{profile.job_title || '—'}</td>
                  <td>
                    <span className={`status-pill ${statusToneMap[profile.status] || 'status-new'}`}>
                      {profile.status}
                    </span>
                  </td>
                  <td>
                    {profile.resume_url ? (
                      <a className="linkedin-link" href={getAssetUrl(profile.resume_url)} rel="noreferrer" target="_blank">
                        <span>View Resume</span>
                        <Download size={14} />
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    <a
                      className="linkedin-link"
                      href={profile.linkedin_url?.startsWith('http') ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>View</span>
                      <ExternalLink size={14} />
                    </a>
                  </td>
                  <td>
                    <button
                      aria-label={`Delete ${profile.full_name}`}
                      className="delete-icon-btn"
                      onClick={() => handleDelete(profile.id)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-5" colSpan="7">
                    No candidate profiles matched your filters.
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
