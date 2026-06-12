import { Bell, BriefcaseBusiness, KeyRound, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getPasswordRequests, getSuperAdminDashboard } from '../../services/api';

export default function WorkspaceNotifications() {
  const [dashboard, setDashboard] = useState({
    recentJobs: [],
    recentProfiles: []
  });
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    async function load() {
      const [dashboardResponse, requestResponse] = await Promise.all([
        getSuperAdminDashboard(),
        getPasswordRequests()
      ]);

      setDashboard(dashboardResponse.data || { recentJobs: [], recentProfiles: [] });
      setRequests(requestResponse.data || []);
    }

    load();
  }, []);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading-row">
        <div>
          <div className="workspace-heading">My Workspace</div>
          <h1 className="dashboard-page-title">Notifications</h1>
          <p className="dashboard-page-copy mb-0">
            Track password requests, recent jobs, and the latest candidate activity from one place.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="reference-table-card">
          <div className="saved-jobs-head">
            <div className="candidate-cell">
              <div className="settings-card-icon tone-amber">
                <KeyRound size={18} />
              </div>
              <div>
                <h5 className="section-title mb-1">Password Requests</h5>
                <p className="section-copy mb-0">Pending and resolved recruiter support requests.</p>
              </div>
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
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.admin_name || 'Unknown Recruiter'}</td>
                    <td>{request.phone}</td>
                    <td>
                      <span className={`status-pill ${request.status === 'pending' ? 'status-amber' : 'status-selected'}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>{new Date(request.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {requests.length === 0 ? (
                  <tr>
                    <td className="text-center text-muted py-5" colSpan="4">
                      No password notifications yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="reference-table-card">
          <div className="saved-jobs-head">
            <div className="candidate-cell">
              <div className="settings-card-icon tone-blue">
                <Bell size={18} />
              </div>
              <div>
                <h5 className="section-title mb-1">Recent Platform Activity</h5>
                <p className="section-copy mb-0">Latest jobs and candidate profiles across the platform.</p>
              </div>
            </div>
          </div>

          <div className="notifications-stack">
            {dashboard.recentJobs.map((job) => (
              <div className="notification-line" key={`job-${job.id}`}>
                <div className="notification-icon tone-green">
                  <BriefcaseBusiness size={16} />
                </div>
                <div>
                  <strong>{job.job_title}</strong> was posted by {job.admin_name || 'a recruiter'}.
                </div>
              </div>
            ))}

            {dashboard.recentProfiles.map((profile) => (
              <div className="notification-line" key={`profile-${profile.id}`}>
                <div className="notification-icon tone-purple">
                  <Users size={16} />
                </div>
                <div>
                  <strong>{profile.full_name}</strong> applied for {profile.job_title || 'a role'}.
                </div>
              </div>
            ))}

            {dashboard.recentJobs.length === 0 && dashboard.recentProfiles.length === 0 ? (
              <div className="text-muted p-4">No recent platform activity yet.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
