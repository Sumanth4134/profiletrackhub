import { useNavigate } from 'react-router-dom';

import JobManagementPanel from '../../components/JobManagementPanel';
import { getCurrentAdmin } from '../../services/authSession';

export default function Jobs() {
  const navigate = useNavigate();
  const isSuperAdmin = getCurrentAdmin()?.role === 'super_admin';
  const dashboardRoute = isSuperAdmin ? '/super-admin/workspace' : '/admin/dashboard';
  const profilesRoute = isSuperAdmin ? '/super-admin/candidates' : '/admin/profiles';

  return (
    <div className="dashboard-shell premium-jobs-shell">
      <div className="jobs-page-topbar">
        <button className="back-link-btn" onClick={() => navigate(dashboardRoute)} type="button">
          ← Back to Dashboard
        </button>
      </div>

      <div className="dashboard-heading-row jobs-heading-block">
        <div>
          <div className="workspace-heading">{isSuperAdmin ? 'Super Admin Workspace' : 'Recruiter Workspace'}</div>
          <h1 className="dashboard-page-title">{isSuperAdmin ? 'Super Admin Job Workspace' : 'Jobs Workspace'}</h1>
          <p className="dashboard-page-copy mb-0">
            This route remains available, but the same job management experience is now built directly into the dashboard.
          </p>
        </div>
      </div>

      <JobManagementPanel profilesRoute={profilesRoute} />
    </div>
  );
}
