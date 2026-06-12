import { Copy, ExternalLink, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getAdminJobs } from '../../services/api';
import { getCurrentAdmin } from '../../services/authSession';

export default function CreateLink() {
  const navigate = useNavigate();
  const isSuperAdmin = getCurrentAdmin()?.role === 'super_admin';
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    async function loadJobs() {
      const response = await getAdminJobs();
      setJobs(response.data || []);
    }

    loadJobs();
  }, []);

  const copyLink = async (value) => {
    await navigator.clipboard.writeText(value);
    alert('Public link copied.');
  };

  return (
    <div className="dashboard-shell">
      <div className="jobs-page-topbar">
        <button
          className="back-link-btn"
          onClick={() => navigate(isSuperAdmin ? '/super-admin/workspace' : '/admin/dashboard')}
          type="button"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="dashboard-heading-row">
        <div>
          <div className="workspace-heading">{isSuperAdmin ? 'My Workspace' : 'Public Links'}</div>
          <h1 className="dashboard-page-title">Create Job Link</h1>
          <p className="dashboard-page-copy mb-0">
            Every job generates its own secure public apply link. Share only the role you want candidates to see.
          </p>
        </div>
      </div>

      <div className="reference-table-card">
        <div className="saved-jobs-head">
          <div>
            <h5 className="section-title mb-1">Your Public Job Links</h5>
            <p className="section-copy mb-0">Candidates using these links can only view the selected job and submit an application.</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table reference-table align-middle mb-0">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Status</th>
                <th>Public Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="fw-semibold">{job.job_title}</td>
                  <td>
                    <span className={`status-pill ${job.status === 'Active' ? 'status-selected' : 'status-interview'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="text-break">{job.public_url}</td>
                  <td>
                    <div className="jobs-table-actions">
                      <button className="table-icon-action" onClick={() => copyLink(job.public_url)} type="button">
                        <Copy size={15} />
                      </button>
                      <button className="table-icon-action edit" onClick={() => window.open(job.public_url, '_blank')} type="button">
                        <ExternalLink size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-5" colSpan="4">
                    <Link2 className="mb-3" size={28} />
                    <div>Create a job first to generate a public apply link.</div>
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
