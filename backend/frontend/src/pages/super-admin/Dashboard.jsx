import {
  BriefcaseBusiness,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Link2,
  Plus,
  ShieldCheck,
  UserRoundCog,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { exportAdminProfilesCsv, exportAdminProfilesExcel, getSuperAdminDashboard } from '../../services/api';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    counts: { total_admins: 0, total_jobs: 0, total_profiles: 0, total_help_requests: 0 },
    recentJobs: [],
    recentProfiles: [],
    adminJobCounts: [],
    adminProfileCounts: [],
    latestHelpRequests: []
  });

  useEffect(() => {
    async function loadDashboard() {
      const response = await getSuperAdminDashboard();
      setDashboard(response.data);
    }

    loadDashboard();
  }, []);

  const cards = [
    { label: 'Total Recruiters', value: dashboard.counts.total_admins || 0, icon: UserRoundCog, tone: 'blue' },
    { label: 'Total Jobs', value: dashboard.counts.total_jobs || 0, icon: BriefcaseBusiness, tone: 'green' },
    { label: 'Total Profiles', value: dashboard.counts.total_profiles || 0, icon: Users, tone: 'amber' },
    { label: 'Help Requests', value: dashboard.counts.total_help_requests || 0, icon: HelpCircle, tone: 'purple' },
    { label: 'Control Level', value: 'Full', icon: ShieldCheck, tone: 'blue' }
  ];

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading-row">
        <div>
          <div className="workspace-heading">Super Admin Workspace</div>
          <h1 className="dashboard-page-title">Super Admin Dashboard</h1>
          <p className="dashboard-page-copy mb-0">
            Monitor all recruiters, jobs, profiles, and password requests with full platform visibility.
          </p>
        </div>

        <div className="dashboard-actions">
          <button className="dashboard-action-btn primary" onClick={() => navigate('/admin/jobs/create')} type="button">
            <Plus size={16} />
            <span>Add Job</span>
          </button>
          <button className="dashboard-action-btn success" onClick={() => navigate('/super-admin/public-links')} type="button">
            <Link2 size={16} />
            <span>Create Job Link</span>
          </button>
          <button className="dashboard-action-btn white" onClick={() => exportAdminProfilesCsv()} type="button">
            <FileText size={16} />
            <span>Export CSV</span>
          </button>
          <button className="dashboard-action-btn white" onClick={() => exportAdminProfilesExcel()} type="button">
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="reference-stats-grid dashboard-stats-grid-wide">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="reference-stat-card" key={card.label}>
              <div className={`reference-stat-icon tone-${card.tone}`}>
                <Icon size={24} />
              </div>
              <div className="reference-stat-body">
                <div className="reference-stat-label">{card.label}</div>
                <div className="reference-stat-value">{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="reference-table-card">
        <div className="saved-jobs-head">
          <div>
            <h5 className="section-title mb-1">Latest Help Requests</h5>
            <p className="section-copy mb-0">Newest support tickets raised by recruiters across the platform.</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table reference-table align-middle mb-0">
            <thead>
              <tr>
                <th>Request Type</th>
                <th>Name</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.latestHelpRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.request_type}</td>
                  <td>{request.requester_name || request.admin_name || '-'}</td>
                  <td className="fw-semibold">{request.subject}</td>
                  <td>
                    <span className={`status-pill help-status-pill status-${String(request.status).toLowerCase().replace(/\s+/g, '-')}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{new Date(request.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {dashboard.latestHelpRequests.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-5" colSpan="5">
                    No help requests yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="settings-grid">
        <div className="reference-table-card">
          <div className="saved-jobs-head">
            <div>
              <h5 className="section-title mb-1">Recent Jobs</h5>
              <p className="section-copy mb-0">Latest jobs created by all recruiters.</p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table reference-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Recruiter</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="fw-semibold">{job.job_title}</td>
                    <td>{job.admin_name || '—'}</td>
                    <td>
                      <span className={`status-pill ${job.status === 'Active' ? 'status-selected' : 'status-interview'}`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="reference-table-card">
          <div className="saved-jobs-head">
            <div>
              <h5 className="section-title mb-1">Recent Profiles</h5>
              <p className="section-copy mb-0">Latest candidate applications across the whole system.</p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table reference-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Recruiter</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="fw-semibold">{profile.full_name}</td>
                    <td>{profile.admin_name || '—'}</td>
                    <td>
                      <span className="status-pill status-shortlisted">{profile.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        <div className="reference-table-card">
          <div className="saved-jobs-head">
            <div>
              <h5 className="section-title mb-1">Recruiter-wise Job Count</h5>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table reference-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Recruiter</th>
                  <th>Total Jobs</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.adminJobCounts.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.total_jobs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="reference-table-card">
          <div className="saved-jobs-head">
            <div>
              <h5 className="section-title mb-1">Recruiter-wise Profile Count</h5>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table reference-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Recruiter</th>
                  <th>Total Profiles</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.adminProfileCounts.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.total_profiles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
