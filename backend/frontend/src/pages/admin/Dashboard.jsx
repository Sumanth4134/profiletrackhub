import {
  BriefcaseBusiness,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  HelpCircle,
  Link2,
  Plus,
  Star,
  UserRound,
  Users
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AdsShowcase from '../../components/AdsShowcase';
import CandidateProfilesPanel from '../../components/CandidateProfilesPanel';
import {
  exportAdminProfilesCsv,
  exportAdminProfilesExcel,
  getAdminDashboard,
  getPublicAds
} from '../../services/api';
import { getCurrentAdmin } from '../../services/authSession';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentAdmin = getCurrentAdmin();
  const isSuperAdmin = currentAdmin?.role === 'super_admin';
  const createJobRoute = '/admin/jobs/create';
  const profilesRoute = isSuperAdmin ? '/super-admin/candidates' : '/admin/profiles';
  const [dashboard, setDashboard] = useState({
    counts: {
      total_profiles: 0,
      active_jobs: 0,
      shortlisted_profiles: 0,
      interview_profiles: 0
    }
  });
  const [ads, setAds] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      const response = await getAdminDashboard();
      setDashboard(response.data);
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    async function loadAds() {
      if (isSuperAdmin) {
        setAds([]);
        return;
      }

      const response = await getPublicAds('recruiter_dashboard');
      setAds(response.data || []);
    }

    loadAds();
  }, [isSuperAdmin]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = currentAdmin?.name?.trim() || 'Recruiter';

    if (hour < 12) {
      return `Good Morning, ${name}`;
    }

    if (hour < 17) {
      return `Good Afternoon, ${name}`;
    }

    return `Good Evening, ${name}`;
  }, [currentAdmin?.name]);

  const cards = useMemo(
    () => [
      {
        label: 'Total Candidates',
        value: dashboard.counts.total_profiles || 0,
        helper: 'View all candidates',
        icon: Users,
        tone: 'blue',
        onClick: () => navigate(profilesRoute)
      },
      {
        label: 'Active Jobs',
        value: dashboard.counts.active_jobs || 0,
        helper: 'View all jobs',
        icon: BriefcaseBusiness,
        tone: 'green',
        onClick: () => navigate('/admin/jobs')
      },
      {
        label: 'Shortlisted',
        value: dashboard.counts.shortlisted_profiles || 0,
        helper: 'View shortlisted',
        icon: Star,
        tone: 'amber',
        onClick: () => navigate(`${profilesRoute}?status=Shortlisted`)
      },
      {
        label: 'Interview Process',
        value: dashboard.counts.interview_profiles || 0,
        helper: 'View in process',
        icon: UserRound,
        tone: 'purple',
        onClick: () => navigate(`${profilesRoute}?status=Interview%20Process`)
      },
      {
        label: 'Help Requests',
        value: dashboard.counts.total_help_requests || 0,
        helper: 'Open help center',
        icon: HelpCircle,
        tone: 'blue',
        onClick: () => navigate('/help-center')
      }
    ],
    [dashboard.counts, navigate, profilesRoute]
  );

  return (
    <div className="dashboard-shell dashboard-shell-reference">
      <div className="dashboard-heading-row reference-heading-row">
        <div>
          {isSuperAdmin ? <div className="workspace-heading">My Workspace</div> : null}
          <h1 className="dashboard-page-title">{isSuperAdmin ? 'Workspace Dashboard' : 'Recruiter Dashboard'}</h1>
          <p className="dashboard-page-copy mb-0">
            {isSuperAdmin
              ? 'Track applicants and launch the public jobs page from one place.'
              : greeting}
          </p>
        </div>

        <div className="dashboard-actions">
          <button className="dashboard-action-btn primary" onClick={() => navigate(createJobRoute)} type="button">
            <Plus size={16} />
            <span>Add Job</span>
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

      {!isSuperAdmin ? <AdsShowcase ads={ads} title="Active Campaigns" /> : null}

      <button className="dashboard-public-link-card" onClick={() => navigate('/jobs')} type="button">
        <div className="dashboard-public-link-copy">
          <div className="dashboard-public-link-title">
            <Link2 size={18} />
            <span>Public Jobs Link</span>
          </div>
          <div className="dashboard-public-link-url">/jobs</div>
          <p className="dashboard-public-link-text mb-0">
            Open the live public jobs page where users can see all active vacancies and apply.
          </p>
        </div>
        <div className="dashboard-public-link-open">
          <ExternalLink size={16} />
          <span>Open Public Jobs</span>
        </div>
      </button>

      <div className="reference-stats-grid dashboard-stats-grid dashboard-stats-grid-wide">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <button className={`reference-stat-card stat-button premium-stat-card tone-border-${card.tone}`} key={card.label} onClick={card.onClick} type="button">
              <div className={`reference-stat-icon tone-${card.tone}`}>
                <Icon size={24} />
              </div>
              <div className="reference-stat-body">
                <div className="reference-stat-label">{card.label}</div>
                <div className="reference-stat-value">{card.value}</div>
                <div className={`reference-stat-helper helper-${card.tone}`}>
                  {card.helper}
                  <span className="reference-stat-arrow">›</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <CandidateProfilesPanel />
    </div>
  );
}
