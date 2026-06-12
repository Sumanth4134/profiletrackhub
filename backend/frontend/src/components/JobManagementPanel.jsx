import {
  BriefcaseBusiness,
  Copy,
  ExternalLink,
  Link2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createJob, createJobRole, deleteJob, getAdminJobs, getJobRoles, updateJob } from '../services/api';
import { getPublicAppUrl } from '../services/runtime';

const initialForm = {
  jobTitle: '',
  jobRole: 'General',
  location: '',
  vacancies: 1,
  experience: '',
  skills: '',
  jobDescription: '',
  status: 'Active'
};

export default function JobManagementPanel({ onJobsChanged, profilesRoute }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [roles, setRoles] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [addingRole, setAddingRole] = useState(false);

  const loadJobs = async () => {
    setLoading(true);

    try {
      const response = await getAdminJobs();
      setJobs(response.data || []);
      console.debug('Loaded admin jobs:', response.data || []);
    } catch (error) {
      console.error('Failed to load admin jobs:', error?.response?.data || error);
      setNotice(error?.response?.data?.error || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await getJobRoles();
      setRoles(response.data || []);
    } catch (error) {
      console.error('Failed to load job roles:', error?.response?.data || error);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const latestPublicLink = useMemo(() => generatedLink || jobs[0]?.public_url || '', [generatedLink, jobs]);
  const roleOptions = useMemo(() => {
    const mergedRoles = [{ role_name: 'General' }, ...roles];

    if (form.jobRole && !mergedRoles.some((role) => role.role_name === form.jobRole)) {
      mergedRoles.push({ role_name: form.jobRole });
    }

    return mergedRoles.filter(
      (role, index, array) => array.findIndex((entry) => entry.role_name === role.role_name) === index
    );
  }, [form.jobRole, roles]);
  const publicJobsUrl = useMemo(() => {
    return getPublicAppUrl('/jobs');
  }, []);

  const handleChange = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const handleReset = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');

    const payload = {
      jobTitle: form.jobTitle,
      jobRole: form.jobRole || 'General',
      location: form.location,
      vacancies: Number(form.vacancies),
      status: form.status,
      experience: form.experience,
      skills: form.skills,
      jobDescription: form.jobDescription
    };

    try {
      const response = editingId
        ? await updateJob(editingId, payload)
        : await createJob(payload);

      console.debug(editingId ? 'Updated job response:' : 'Created job response:', response?.data);
      setNotice(editingId ? 'Job updated successfully.' : 'Job created successfully.');
      setGeneratedLink(response?.data?.public_url || latestPublicLink);
      setEditingId(null);
      setForm(initialForm);
      await loadJobs();
      await onJobsChanged?.();
    } catch (error) {
      console.error('Failed to save job:', error?.response?.data || error);
      setNotice(error?.response?.data?.error || error?.message || 'Unable to save job right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (job) => {
    setEditingId(job.id);
    setForm({
      jobTitle: job.job_title || '',
      jobRole: job.job_role || 'General',
      location: job.location || '',
      vacancies: job.vacancies || 1,
      experience: job.experience || '',
      skills: job.skills || '',
      jobDescription: job.job_description || '',
      status: job.status || 'Active'
    });
    document.getElementById('job-management-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      setNotice('Enter a new role name first.');
      return;
    }

    setAddingRole(true);
    setNotice('');

    try {
      const response = await createJobRole({ roleName: newRoleName });
      const savedRole = response.data;
      await loadRoles();
      handleChange('jobRole', savedRole.role_name);
      setNewRoleName('');
      setNotice('New job role added successfully.');
    } catch (error) {
      console.error('Failed to create role:', error?.response?.data || error);
      setNotice(error?.response?.data?.error || 'Failed to create role.');
    } finally {
      setAddingRole(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job?')) {
      return;
    }

    await deleteJob(id);
    setNotice('Job deleted successfully.');
    await loadJobs();
    await onJobsChanged?.();
  };

  const handleCopyLink = async (link) => {
    if (!link) {
      return;
    }

    await navigator.clipboard.writeText(link);
    setNotice('Public job link copied.');
  };

  const getJobPublicLink = (job) => {
    if (job?.public_url) {
      return job.public_url;
    }

    if (typeof window === 'undefined') {
      return job?.public_slug ? `/jobs/${job.public_slug}` : `/apply?jobId=${job?.id || ''}`;
    }

    if (job?.public_slug) {
      return getPublicAppUrl(`/jobs/${job.public_slug}`);
    }

    return getPublicAppUrl(`/apply?jobId=${job?.id || ''}`);
  };

  return (
    <section className="job-management-panel reference-table-card" id="job-management-panel">
      <div className="job-management-head">
        <div>
          <div className="workspace-heading">Job Management</div>
          <h2 className="job-management-title">Create, publish, and manage vacancies from one workspace.</h2>
          <p className="section-copy mb-0">
            Every new vacancy generates a secure public apply link that candidates can use directly.
          </p>
        </div>
        <div className="job-management-pill">
          <BriefcaseBusiness size={16} />
          <span>{jobs.length} saved jobs</span>
        </div>
      </div>

      <div className="jobs-link-box premium-link-card">
        <div className="jobs-link-head">
          <div className="jobs-link-icon">
            <Link2 size={18} />
          </div>
          <div>
            <div className="jobs-link-title">Public Jobs Link</div>
            <div className="jobs-link-copy">Use the latest generated link or copy any specific link from the jobs table below.</div>
          </div>
        </div>

        <div className="premium-link-row">
          <input
            className="form-control reference-input public-link-input"
            readOnly
            value={publicJobsUrl}
          />
          <div className="jobs-link-actions">
            <button className="dashboard-action-btn white" onClick={() => handleCopyLink(publicJobsUrl)} type="button">
              <Copy size={16} />
              <span>Copy</span>
            </button>
            <button
              className="dashboard-action-btn success"
              onClick={() => window.open(publicJobsUrl, '_blank')}
              type="button"
            >
              <ExternalLink size={16} />
              <span>Open</span>
            </button>
          </div>
        </div>
      </div>

      {notice ? <div className="inline-toast success">{notice}</div> : null}

      <div className="job-form-card premium-form-card">
        <form className="job-management-form row g-4" onSubmit={handleSubmit}>
          <div className="col-lg-6">
            <label className="reference-label">Job Title</label>
            <div className="input-group input-icon-left">
              <BriefcaseBusiness className="input-icon" size={18} />
              <input
                className="form-control form-input premium-lg-input"
                placeholder="Frontend Developer"
                value={form.jobTitle}
                onChange={(event) => handleChange('jobTitle', event.target.value)}
              />
            </div>
          </div>

          <div className="col-lg-6">
            <label className="reference-label">Job Role</label>
            <div className="row g-2">
              <div className="col-md-7">
                <select
                  className="form-select form-select-base premium-lg-input"
                  value={form.jobRole}
                  onChange={(event) => handleChange('jobRole', event.target.value)}
                >
                  {roleOptions.map((role) => (
                    <option key={role.role_name} value={role.role_name}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-5">
                <div className="premium-input-wrap floating-input-wrap">
                  <input
                    className="form-control form-input premium-lg-input"
                    placeholder="+ Add New Role"
                    value={newRoleName}
                    onChange={(event) => setNewRoleName(event.target.value)}
                  />
                </div>
              </div>
              <div className="col-12">
                <button
                  className="dashboard-action-btn white"
                  disabled={addingRole}
                  onClick={handleCreateRole}
                  type="button"
                >
                  <Plus size={16} />
                  <span>{addingRole ? 'Adding Role...' : 'Add New Role'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <label className="reference-label">Location</label>
            <div className="input-group input-icon-left">
              <MapPin className="input-icon" size={18} />
              <input
                className="form-control form-input premium-lg-input"
                placeholder="New York,US.. etc."
                value={form.location}
                onChange={(event) => handleChange('location', event.target.value)}
              />
            </div>
          </div>

          <div className="col-lg-6">
            <label className="reference-label">Vacancies</label>
            <div className="input-group input-icon-left">
              <Users className="input-icon" size={18} />
              <input
                className="form-control form-input premium-lg-input"
                min="1"
                placeholder="3"
                type="number"
                value={form.vacancies}
                onChange={(event) => handleChange('vacancies', event.target.value)}
              />
            </div>
          </div>

          <div className="col-lg-6">
            <label className="reference-label">Status</label>
            <select
              className="form-select form-select-base premium-lg-input"
              value={form.status}
              onChange={(event) => handleChange('status', event.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-lg-6">
            <label className="reference-label">Experience</label>
            <input
              className="form-control form-input premium-lg-input"
              placeholder="3+ years"
              value={form.experience}
              onChange={(event) => handleChange('experience', event.target.value)}
            />
          </div>

          <div className="col-lg-6">
            <label className="reference-label">Skills</label>
            <input
              className="form-control form-input premium-lg-input"
              placeholder="React, Node.js, PostgreSQL"
              value={form.skills}
              onChange={(event) => handleChange('skills', event.target.value)}
            />
          </div>

          <div className="col-lg-6">
            <label className="reference-label">Description</label>
            <textarea
              className="form-control form-textarea premium-lg-textarea"
              placeholder="Describe responsibilities, requirements, and the hiring focus..."
              value={form.jobDescription}
              onChange={(event) => handleChange('jobDescription', event.target.value)}
            />
          </div>

          <div className="col-12">
            <div className="premium-form-actions job-management-actions">
              <button className="dashboard-action-btn white" onClick={handleReset} type="button">
                <Pencil size={16} />
                <span>{editingId ? 'Cancel Edit' : 'Reset Form'}</span>
              </button>
              <button className="dashboard-action-btn primary dashboard-action-btn-lg" disabled={saving} type="submit">
                <Plus size={18} />
                <span>{saving ? 'Saving Job...' : editingId ? 'Update Job' : 'Create Job'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="saved-jobs-dashboard-card">
        <div className="saved-jobs-head">
          <div>
            <h5 className="section-title mb-1">Saved Jobs</h5>
            <p className="section-copy mb-0">Track vacancy status, public links, and incoming applications without leaving the dashboard.</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table reference-table premium-jobs-table dashboard-jobs-table align-middle mb-0">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Status</th>
                <th>Vacancies</th>
                <th>Applications</th>
                <th>Public Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="text-center text-muted py-5" colSpan="6">
                    Loading jobs...
                  </td>
                </tr>
              ) : null}

              {!loading && jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div className="dashboard-job-title-cell">
                      <div className="fw-semibold">{job.job_title}</div>
                      <small>{job.job_role || 'General'} • {job.location || '-'}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${job.status === 'Active' ? 'status-selected' : 'status-interview'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.vacancies}</td>
                  <td>{job.applications_count || 0}</td>
                  <td>
                    <button
                      className="dashboard-link-btn"
                      onClick={() => window.open(getJobPublicLink(job), '_blank')}
                      type="button"
                    >
                      <Link2 size={15} />
                      <span>Open Link</span>
                    </button>
                  </td>
                  <td>
                    <div className="dashboard-job-actions">
                        <button className="table-icon-action edit" onClick={() => handleEdit(job)} title="Edit" type="button">
                          <Pencil size={16} />
                        </button>
                        <button
                          className="table-icon-action"
                          onClick={() => handleCopyLink(getJobPublicLink(job))}
                          title="Copy link"
                          type="button"
                        >
                          <Copy size={16} />
                        </button>
                      <button
                        className="table-icon-action"
                        onClick={() => navigate(`${profilesRoute}?job_title=${encodeURIComponent(job.job_title)}`)}
                        title="View applications"
                        type="button"
                      >
                        <Users size={16} />
                      </button>
                      <button className="table-icon-action delete" onClick={() => handleDelete(job.id)} title="Delete" type="button">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && jobs.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-5" colSpan="6">
                    No jobs created yet. Use the form above to launch your first vacancy.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
