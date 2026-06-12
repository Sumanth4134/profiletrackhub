import { BriefcaseBusiness, ExternalLink, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getSuperAdminJobs } from '../../services/api';

export default function SuperAdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  useEffect(() => {
    async function loadJobs() {
      const response = await getSuperAdminJobs();
      setJobs(response.data || []);
    }

    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = !filters.search || [job.job_title, job.admin_name, job.location]
        .some((value) => String(value || '').toLowerCase().includes(filters.search.toLowerCase()));
      const matchesStatus = !filters.status || job.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [filters, jobs]);

  const analytics = useMemo(() => ({
    total: filteredJobs.length,
    active: filteredJobs.filter((job) => job.status === 'Active').length,
    inactive: filteredJobs.filter((job) => job.status !== 'Active').length
  }), [filteredJobs]);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading-row">
        <div>
          <h1 className="dashboard-page-title">All Jobs</h1>
          <p className="dashboard-page-copy mb-0">Review jobs created by every recruiter across the platform.</p>
        </div>
      </div>

      <div className="reference-stats-grid">
        {[
          { label: 'Total Jobs', value: analytics.total, tone: 'blue' },
          { label: 'Active Jobs', value: analytics.active, tone: 'green' },
          { label: 'Inactive Jobs', value: analytics.inactive, tone: 'purple' }
        ].map((card) => (
          <div className="reference-stat-card" key={card.label}>
            <div className={`reference-stat-icon tone-${card.tone}`}>
              <BriefcaseBusiness size={24} />
            </div>
            <div className="reference-stat-body">
              <div className="reference-stat-label">{card.label}</div>
              <div className="reference-stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="reference-panel">
        <div className="row g-3 align-items-end">
          <div className="col-md-8">
            <label className="reference-label">Search jobs</label>
            <div className="reference-input-wrap">
              <input
                className="form-control reference-input pe-5"
                placeholder="Search by title, admin, or location"
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="reference-table-card">
        <div className="table-responsive">
          <table className="table reference-table align-middle mb-0">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Recruiter</th>
                <th>Location</th>
                <th>Vacancies</th>
                <th>Status</th>
                <th>Public Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td className="fw-semibold">{job.job_title}</td>
                  <td>{job.admin_name || '—'}</td>
                  <td>{job.location || '—'}</td>
                  <td>{job.vacancies}</td>
                  <td>
                    <span className={`status-pill ${job.status === 'Active' ? 'status-selected' : 'status-interview'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    {job.public_slug ? (
                      <a className="linkedin-link" href={`/jobs/${job.public_slug}`} rel="noreferrer" target="_blank">
                        <span>Open</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-5" colSpan="6">
                    No jobs matched your filters.
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
