
import { ExternalLink, Filter, Search, Trash2, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  deleteAdminProfileRecord,
  getAdminProfiles,
  updateAdminProfileStatus
} from '../services/api';
import { getCurrentAdmin } from '../services/authSession';

const statusToneMap = {
  New: 'status-new',
  'Interview Process': 'status-interview',
  Shortlisted: 'status-shortlisted',
  Selected: 'status-selected'
};

export default function CandidateProfilesPanel({ showHeading = false }) {
  const [searchParams] = useSearchParams();
  const isSuperAdmin = getCurrentAdmin()?.role === 'super_admin';
  const profileBaseRoute = isSuperAdmin ? '/super-admin/candidates' : '/admin/profiles';
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    name: searchParams.get('name') || '',
    job_title: searchParams.get('job_title') || '',
    experience: searchParams.get('experience') || '',
    status: searchParams.get('status') || ''
  });

  const loadData = async (nextFilters = filters, nextPage = page) => {
    const response = await getAdminProfiles({ ...nextFilters, page: nextPage, pageSize: 10 });
    setData(response.data.data || []);
    setTotal(response.data.total || 0);
  };

  useEffect(() => {
    loadData(filters, page);
  }, [page]);

  useEffect(() => {
    if (searchParams.toString()) {
      const nextFilters = {
        name: searchParams.get('name') || '',
        job_title: searchParams.get('job_title') || '',
        experience: searchParams.get('experience') || '',
        status: searchParams.get('status') || ''
      };
      setFilters(nextFilters);
      setPage(1);
      loadData(nextFilters, 1);
    }
  }, [searchParams]);

  const handleStatusChange = async (id, status) => {
    await updateAdminProfileStatus(id, status);
    loadData(filters, page);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) {
      return;
    }

    await deleteAdminProfileRecord(id);
    loadData(filters, page);
  };

  return (
    <div className="dashboard-table-stage">
      {showHeading ? (
        <div className="dashboard-heading-row">
          <div>
            <h1 className="dashboard-page-title">Profiles</h1>
            <p className="dashboard-page-copy mb-0">
              {isSuperAdmin
                ? 'Manage the profiles received through your own super admin workspace jobs.'
                : 'Review only the candidate applications received for your jobs.'}
            </p>
          </div>
        </div>
      ) : null}

      <div className="reference-panel reference-filter-panel">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6 col-xl-3">
            <label className="reference-label">Search name</label>
            <div className="input-group input-icon-right">
              <input
                className="form-control form-input"
                placeholder="Search by name..."
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
              <Search className="input-icon" size={18} />
            </div>
          </div>

          <div className="col-12 col-md-6 col-xl-3">
            <label className="reference-label">Job title</label>
            <input
              className="form-control reference-input"
              placeholder="Enter job title"
              value={filters.job_title}
              onChange={(e) => setFilters({ ...filters, job_title: e.target.value })}
            />
          </div>

          <div className="col-12 col-md-6 col-xl-3">
            <label className="reference-label">Experience</label>
            <input
              className="form-control reference-input"
              placeholder="Enter experience"
              value={filters.experience}
              onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
            />
          </div>

          <div className="col-12 col-md-6 col-xl-2">
            <label className="reference-label">Status</label>
            <select
              className="form-select form-select-base"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="New">New</option>
              <option value="Interview Process">Interview Process</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Selected">Selected</option>
            </select>
          </div>

          <div className="col-12 col-xl-1">
            <button className="reference-apply-btn dashboard-filter-btn" onClick={() => loadData(filters, 1)} type="button">
              <Filter size={16} />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>

      <div className="reference-table-card dashboard-candidates-card">
        <div className="table-responsive">
          <table className="table reference-table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Job Title</th>
                <th>Phone</th>
                <th>Experience</th>
                <th>Status</th>
                <th>LinkedIn</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((candidate) => (
                <tr key={candidate.id}>
                  <td>
                    <div className="candidate-cell">
                      <div className="candidate-avatar">
                        <UserRound size={16} />
                      </div>
                      <Link className="candidate-name-link" to={`${profileBaseRoute}/${candidate.id}`}>
                        {candidate.full_name}
                      </Link>
                    </div>
                  </td>
                  <td>
                    <div className="dashboard-job-title-cell">
                      <div className="fw-semibold">{candidate.job_title || '-'}</div>
                      <small>{candidate.job_role || 'General'}</small>
                    </div>
                  </td>
                  <td>{candidate.phone}</td>
                  <td>{candidate.experience || '-'}</td>
                  <td>
                    <span className={`status-pill ${statusToneMap[candidate.status] || 'status-new'}`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td>
                    <a
                      className="linkedin-link"
                      href={candidate.linkedin_url?.startsWith('http') ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>View LinkedIn</span>
                      <ExternalLink size={14} />
                    </a>
                  </td>
                  <td>
                    <div className="table-action-row">
                      <select
                        className="form-select form-select-sm dashboard-status-select"
                        value={candidate.status}
                        onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                      >
                        <option value="New">New</option>
                        <option value="Interview Process">Interview Process</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Selected">Selected</option>
                      </select>

                      <button className="delete-icon-btn" onClick={() => handleDelete(candidate.id)} type="button">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {data.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-5" colSpan="7">
                    No candidate profiles found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="reference-table-footer">
          <div className="pagination-summary">
            <strong>Total Profiles:</strong> {total}
          </div>

          <div className="pagination-controls">
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)} type="button">
              Prev
            </button>
            <span className="pagination-chip active">{page}</span>
            <button className="pagination-btn" disabled={data.length === 0} onClick={() => setPage(page + 1)} type="button">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
