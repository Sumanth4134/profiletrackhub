import { FileText } from 'lucide-react';

import CandidateProfilesPanel from '../../components/CandidateProfilesPanel';
import { exportAdminProfilesCsv } from '../../services/api';

export default function AllUsers() {
  return (
    <div className="dashboard-shell dashboard-shell-reference">
      <div className="dashboard-heading-row">
        <div>
          <div className="workspace-heading">Candidate Workspace</div>
          <h1 className="dashboard-page-title">All Users</h1>
          <p className="dashboard-page-copy mb-0">
            Review candidate applications, update statuses, and export profile data from one place.
          </p>
        </div>

        <div className="dashboard-actions">
          <button className="dashboard-action-btn white" onClick={() => exportAdminProfilesCsv()} type="button">
            <FileText size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <CandidateProfilesPanel />
    </div>
  );
}
