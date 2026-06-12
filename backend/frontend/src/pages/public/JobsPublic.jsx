import {
  BadgeCheck,
  BriefcaseBusiness,
  Bug,
  ChevronRight,
  Code2,
  Database,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TestTube2
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import AdsShowcase from '../../components/AdsShowcase';
import AppFooter from '../../components/AppFooter';
import { getPublicAds, getPublicJobRoles, getPublicJobsByRole } from '../../services/api';

function FooterBar() {
  return (
    <footer className="global-footer public-footer">
      <span>MJHUBTECH.Ltd</span>
      <small>Talent solutions • Hiring support • Profile tracking</small>
    </footer>
  );
}

const rolePresentationMap = {
  'QA Analyst': {
    icon: Bug,
    description: 'Quality-focused roles covering test strategy, validation, and release confidence.'
  },
  Development: {
    icon: Code2,
    description: 'Engineering opportunities across frontend, backend, and full-stack delivery.'
  },
  'API Testing': {
    icon: TestTube2,
    description: 'Integration, contract, and service validation roles for modern product teams.'
  },
  DevOps: {
    icon: BriefcaseBusiness,
    description: 'Infrastructure, automation, CI/CD, observability, and platform operations openings.'
  },
  'Data Analyst': {
    icon: Database,
    description: 'Analytics, reporting, dashboards, and insights roles to support business growth.'
  },
  'Cyber Security': {
    icon: ShieldCheck,
    description: 'Security operations, governance, risk, and protection-focused hiring tracks.'
  },
  Other: {
    icon: BadgeCheck,
    description: 'Specialized openings that do not fit into the core role categories.'
  },
  General: {
    icon: Sparkles,
    description: 'General hiring lane for active openings without a specialized role bucket.'
  }
};

export default function JobsPublic() {
  const navigate = useNavigate();
  const { roleName } = useParams();
  const selectedRole = roleName ? decodeURIComponent(roleName) : '';
  const [roles, setRoles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [filters, setFilters] = useState({
    location: '',
    experience: '',
    jobType: '',
    workPreference: ''
  });

  useEffect(() => {
    async function loadAds() {
      const response = await getPublicAds('public_jobs');
      setAds(response.data || []);
    }

    loadAds();
  }, []);

  useEffect(() => {
    async function loadRoles() {
      if (selectedRole) {
        return;
      }

      setLoading(true);

      try {
        const response = await getPublicJobRoles();
        setRoles(response.data || []);
      } catch (error) {
        console.error('Failed to load public job roles:', error?.response?.data || error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    loadRoles();
  }, [selectedRole]);

  useEffect(() => {
    async function loadJobs() {
      if (!selectedRole) {
        return;
      }

      setLoading(true);

      try {
        const response = await getPublicJobsByRole(selectedRole);
        setJobs(response.data || []);
      } catch (error) {
        console.error('Failed to load public jobs by role:', error?.response?.data || error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [selectedRole]);

  const roleOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return roles;
    }

    return roles.filter((role) => role.role_name?.toLowerCase().includes(query));
  }, [roles, search]);

  const filterOptions = useMemo(() => {
    const unique = (items) => [...new Set(items.filter(Boolean))];

    return {
      locations: unique(jobs.map((job) => job.location)),
      experiences: unique(jobs.map((job) => job.experience)),
      jobTypes: unique(jobs.map((job) => job.job_type)),
      workPreferences: unique(jobs.map((job) => job.work_preference || job.work_mode || ''))
    };
  }, [jobs]);

  const toggleFilter = (group, value) => {
    setFilters((current) => ({
      ...current,
      [group]: value
    }));
  };

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.job_title?.toLowerCase().includes(query) ||
        job.job_description?.toLowerCase().includes(query);
      const matchesLocation =
        !filters.location || filters.location === job.location;
      const matchesExperience =
        !filters.experience || filters.experience === job.experience;
      const matchesJobType =
        !filters.jobType || filters.jobType === job.job_type;
      const workPreferenceValue = job.work_preference || job.work_mode || '';
      const matchesWorkPreference =
        !filters.workPreference || filters.workPreference === workPreferenceValue;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesExperience &&
        matchesJobType &&
        matchesWorkPreference
      );
    });
  }, [filters, jobs, search]);

  return (
    <div className="public-jobs-shell d-flex flex-column">
      <header className="public-jobs-hero public-roles-hero">
        <div className="public-jobs-container">
          <div className="public-jobs-header">
            <div className="public-jobs-brand">
              <div className="public-jobs-logo public-jobs-logo-fallback">P</div>
              <div>
                <div className="public-jobs-kicker">Vacancy Portal</div>
                <h1 className="public-jobs-title">ProfileTrackHub</h1>
                <p className="public-jobs-subtitle mb-0">
                  {selectedRole
                    ? `Explore active ${selectedRole} openings and apply through the hiring portal.`
                    : 'Explore roles and apply to active openings.'}
                </p>
              </div>
            </div>

            <div className="public-search public-search-premium">
              <Search size={18} />
              <input
                className="form-control form-input"
                placeholder={selectedRole ? 'Search job title' : 'Search job role'}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="public-jobs-container public-jobs-content flex-grow-1">
        <AdsShowcase ads={ads} title="Hiring Campaign Highlights" />

        {selectedRole ? (
          <>
            <section className="public-role-results-hero">
              <div className="public-role-results-top">
                <button
                  className="dashboard-action-btn white"
                  onClick={() => navigate('/jobs')}
                  type="button"
                >
                  <ChevronRight className="rotate-180" size={16} />
                  <span>Back to Job Roles</span>
                </button>
              </div>

              <div className="public-role-results-head">
                <div>
                  <div className="public-role-results-kicker">
                    <ShieldCheck size={16} />
                    <span>Selected Role</span>
                  </div>
                  <h2 className="public-role-results-title">{selectedRole} Jobs</h2>
                  <p className="public-role-results-count mb-0">
                    {filteredJobs.length} active openings
                  </p>
                </div>
              </div>
            </section>

            <section className="public-role-results-layout">
              <aside className="public-job-filter-panel public-job-filter-sidebar">
                <div className="public-job-filter-sidebar-head">
                  <h5 className="section-title mb-1">Filters</h5>
                  <p className="section-copy mb-0">Refine jobs by location, type, and experience.</p>
                </div>

                <div className="public-job-filter-group">
                  <div className="public-job-filter-title">Location</div>
                  <select
                    className="form-select public-job-filter-select form-select-base"
                    value={filters.location}
                    onChange={(event) => toggleFilter('location', event.target.value)}
                  >
                    <option value="">All Locations</option>
                    {filterOptions.locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="public-job-filter-group">
                  <div className="public-job-filter-title">Work Preference</div>
                  <select
                    className="form-select public-job-filter-select form-select-base"
                    value={filters.workPreference}
                    onChange={(event) => toggleFilter('workPreference', event.target.value)}
                  >
                    <option value="">All Work Preferences</option>
                    {filterOptions.workPreferences.map((preference) => (
                      <option key={preference} value={preference}>
                        {preference}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="public-job-filter-group">
                  <div className="public-job-filter-title">Experience Level</div>
                  <select
                    className="form-select public-job-filter-select form-select-base"
                    value={filters.experience}
                    onChange={(event) => toggleFilter('experience', event.target.value)}
                  >
                    <option value="">All Experience Levels</option>
                    {filterOptions.experiences.map((experience) => (
                      <option key={experience} value={experience}>
                        {experience}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="public-job-filter-group">
                  <div className="public-job-filter-title">Job Type</div>
                  <select
                    className="form-select public-job-filter-select form-select-base"
                    value={filters.jobType}
                    onChange={(event) => toggleFilter('jobType', event.target.value)}
                  >
                    <option value="">All Job Types</option>
                    {filterOptions.jobTypes.map((jobType) => (
                      <option key={jobType} value={jobType}>
                        {jobType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="public-filter-actions">
                  <button className="dashboard-action-btn primary" type="button">
                    Apply Filters
                  </button>
                  <button
                    className="dashboard-action-btn white"
                    onClick={() =>
                      setFilters({
                        location: '',
                        experience: '',
                        jobType: '',
                        workPreference: ''
                      })
                    }
                    type="button"
                  >
                    Clear Filters
                  </button>
                </div>
              </aside>

              <div className="public-role-jobs-panel">
                <div className="public-role-jobs-header">
                  <div className="public-role-jobs-header-labels">
                    <span>Job Title</span>
                    <span>Job Role</span>
                    <span>Location</span>
                    <span>Experience</span>
                    <span>Vacancies</span>
                    <span className="text-end">Action</span>
                  </div>
                </div>

                <div className="public-role-jobs-list">
                  {filteredJobs.map((job) => (
                    <article className="public-role-job-row" key={job.id}>
                      <div className="public-role-job-cell job-title">
                        <div className="public-role-job-label">Job Title</div>
                        <div className="public-role-job-value fw-semibold">{job.job_title}</div>
                      </div>

                      <div className="public-role-job-cell">
                        <div className="public-role-job-label">Job Role</div>
                        <span className="job-role-chip">{job.job_role || selectedRole}</span>
                      </div>

                      <div className="public-role-job-cell">
                        <div className="public-role-job-label">Location</div>
                        <span className="public-role-job-inline">
                          <MapPin size={14} />
                          <span>{job.location || 'Not specified'}</span>
                        </span>
                      </div>

                      <div className="public-role-job-cell">
                        <div className="public-role-job-label">Experience</div>
                        <div className="public-role-job-value">{job.experience || 'Not specified'}</div>
                      </div>

                      <div className="public-role-job-cell">
                        <div className="public-role-job-label">Vacancies</div>
                        <span className="job-vacancy-pill">{job.vacancies} openings</span>
                      </div>

                      <div className="public-role-job-cell action">
                        <div className="public-role-job-label">Action</div>
                        <div className="public-role-job-action-wrap">
                          <Link className="job-apply-btn public-role-job-apply" to={`/apply?jobId=${job.id}`}>
                            Apply
                          </Link>
                        </div>
                        
                      </div>
                    </article>
                  ))}

                  {!loading && filteredJobs.length === 0 ? (
                    <div className="job-public-empty">
                      <div className="job-public-empty-icon">
                        <Sparkles size={22} />
                      </div>
                      <h5 className="mb-2">No jobs found for {selectedRole}</h5>
                      <p className="mb-0">
                        Try another search or filter, or return to the job roles page to browse other openings.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="vacancy-inline-bar role-chip-bar">
              <div className="vacancy-inline-title">
                <Sparkles size={16} />
                <span>Job Roles</span>
              </div>

              <div className="role-chip-list">
                {roleOptions.length > 0 ? (
                  roleOptions.map((role) => (
                    <button
                      className="role-summary-chip"
                      key={role.role_name}
                      onClick={() => navigate(`/jobs/roles/${encodeURIComponent(role.role_name)}`)}
                      type="button"
                    >
                      <span className="role-summary-chip-label">{role.role_name}</span>
                      <span className="role-summary-chip-count">{role.job_count} jobs</span>
                    </button>
                  ))
                ) : (
                  <span className="vacancy-inline-empty">
                    {loading ? 'Loading roles...' : 'No active job roles available right now.'}
                  </span>
                )}
              </div>
            </section>

            <section className="public-jobs-grid public-role-grid">
              {roleOptions.map((role) => {
                const RoleIcon = rolePresentationMap[role.role_name]?.icon || Sparkles;

                return (
                  <article className="job-public-card public-role-card" key={role.role_name}>
                    <div className="job-card-header">
                      <div className="public-role-card-title-wrap">
                        <div className="public-role-card-icon">
                          <RoleIcon size={22} />
                        </div>
                        <div>
                          <span className="job-role-chip">Role Track</span>
                          <h5 className="job-card-title mt-2">{role.role_name}</h5>
                        </div>
                      </div>
                      <div className="public-role-card-count">
                        <span className="job-vacancy-pill">{role.job_count} jobs</span>
                      </div>
                    </div>

                    <p className="public-role-card-description">
                      {rolePresentationMap[role.role_name]?.description ||
                        `Browse all active ${role.role_name} openings and continue to the job titles page for this role.`}
                    </p>

                    <div className="public-role-card-footer">
                      <div className="public-role-card-meta">
                        <span className="job-role-chip">{role.role_name}</span>
                        <span className="public-role-card-meta-copy">Active openings available now</span>
                      </div>

                      <button
                        className="job-apply-btn mt-auto"
                        onClick={() => navigate(`/jobs/roles/${encodeURIComponent(role.role_name)}`)}
                        type="button"
                      >
                        View Jobs
                      </button>
                    </div>
                  </article>
                );
              })}

              {!loading && roleOptions.length === 0 ? (
                <div className="job-public-empty">
                  <div className="job-public-empty-icon">
                    <Sparkles size={22} />
                  </div>
                  <h5 className="mb-2">No active job roles available right now.</h5>
                  <p className="mb-0">Please check back after recruiters publish new openings.</p>
                </div>
              ) : null}
            </section>
          </>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
