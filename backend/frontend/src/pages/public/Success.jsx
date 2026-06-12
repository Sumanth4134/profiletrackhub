import { BriefcaseBusiness, CheckCircle2, X } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import AppFooter from '../../components/AppFooter';

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const candidateName = useMemo(() => searchParams.get('name') || 'Candidate', [searchParams]);

  const handleClose = () => {
    try {
      window.close();
    } catch (_error) {
      // ignored
    }

    setTimeout(() => {
      if (!window.closed) {
        navigate('/jobs');
      }
    }, 150);
  };

  return (
    <div className="d-flex flex-column min-vh-100 apply-page-shell">
      <main className="apply-page-main flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="apply-page-container">
          <div className="apply-page-card text-center">
            <div className="apply-page-kicker mx-auto">
              <CheckCircle2 size={16} />
              Application Status
            </div>
            <div style={{ color: '#16a34a', fontSize: 52, marginBottom: 16 }}>
              <CheckCircle2 size={52} />
            </div>
            <h1 className="apply-page-title">Application Submitted Successfully</h1>
            <p className="apply-page-copy mx-auto">
              Successfully submitted, {candidateName}. Our recruiter will connect with you later.
            </p>

            <div className="dashboard-actions justify-content-center mt-4">
              <button className="dashboard-action-btn white" onClick={handleClose} type="button">
                <X size={16} />
                <span>Close</span>
              </button>
              <button className="dashboard-action-btn primary" onClick={() => navigate('/jobs')} type="button">
                <BriefcaseBusiness size={16} />
                <span>Jobs</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
