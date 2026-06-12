import {
  BriefcaseBusiness,
  FileText,
  Globe,
  Link2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  Wrench
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import AppFooter from '../../components/AppFooter';
import { getPublicJob, getPublicJobById, submitPublicApplication } from '../../services/api';

export default function CandidateForm() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    skills: '',
    experience: '',
    location: '',
    visa: '',
    contractTypes: [],
    workPreferences: []
  });
  const [resume, setResume] = useState(null);
  const [extraFile, setExtraFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState({
    id: '',
    publicSlug: '',
    jobTitle: '',
    jobRole: '',
    jobDescription: '',
    location: '',
    skills: '',
    experience: '',
    vacancies: ''
  });

  const workPreferenceOptions = ['Hybrid', 'Remote', 'On-site', 'Local'];

  useEffect(() => {
    async function loadJob() {
      if (!slug && !jobId) {
        setLoading(false);
        return;
      }

      try {
        const response = slug ? await getPublicJob(slug) : await getPublicJobById(jobId);
        const payload = response.data;

        setJob({
          id: payload.id,
          publicSlug: payload.public_slug || slug || '',
          jobTitle: payload.job_title || '',
          jobRole: payload.job_role || 'General',
          jobDescription: payload.job_description || '',
          location: payload.location || '',
          skills: payload.skills || '',
          experience: payload.experience || '',
          vacancies: payload.vacancies || ''
        });
      } catch (error) {
        console.error('Unable to load selected job:', error?.response?.data || error);
        alert(error?.response?.data?.error || 'Unable to load the selected job.');
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId, slug]);

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const toggleWorkPreference = (option) => {
    setForm((current) => {
      const selected = current.workPreferences || [];
      const nextSelection = selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option];

      return {
        ...current,
        workPreferences: nextSelection
      };
    });
  };

  const toggleContractType = (option) => {
    setForm((current) => {
      const selected = current.contractTypes || [];
      const nextSelection = selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option];

      return {
        ...current,
        contractTypes: nextSelection
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name || !form.email || !form.phone || !form.linkedin_url || !resume) {
      return alert('Please fill all required fields');
    }

    if (!job.publicSlug) {
      return alert('Unable to submit without a selected job.');
    }

    const formData = new FormData();

    formData.append('full_name', form.full_name);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('skills', form.skills || '');
    formData.append('experience', form.experience || '');
    formData.append('location', form.location || '');
    formData.append('preferred_role', job.jobTitle || '');
    formData.append('jobId', job.id || '');
    formData.append('job_title', job.jobTitle || '');
    formData.append('job_role', job.jobRole || 'General');
    formData.append('job_description', job.jobDescription || '');
    formData.append('linkedin_url', form.linkedin_url);
    formData.append('source', 'Public Job Link');
    formData.append('visa', form.visa || '');
    formData.append('contract_type', (form.contractTypes || []).join(', '));
    formData.append('hybrid', (form.workPreferences || []).join(', '));
    formData.append('relocate', '');
    formData.append('resume', resume);

    if (extraFile) {
      formData.append('extra_file', extraFile);
    }

    try {
      await submitPublicApplication(job.publicSlug, formData);
      navigate(`/success?name=${encodeURIComponent(form.full_name)}`);
    } catch (error) {
      console.error('Application submit failed:', error?.response?.data || error);
      alert(error?.response?.data?.error || 'Server error');
    }
  };

  if (loading) {
    return (
      <div className="apply-page-shell d-flex flex-column min-vh-100">
        <main className="apply-page-main flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="apply-page-card">Loading job details...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="apply-page-shell d-flex flex-column min-vh-100">
      <main className="apply-page-main flex-grow-1">
        <div className="apply-page-container">
          <div className="apply-page-card">
            <div className="apply-page-header">
              <div className="apply-page-kicker">
                <Sparkles size={16} />
                Public Job Application
              </div>
              <h1 className="apply-page-title">
                Apply for <span>{job.jobTitle || 'Open Position'}</span>
              </h1>
              <p className="apply-page-copy">
              </p>
            </div>

            {job.jobDescription && (
              <div className="apply-job-summary">
                <div className="apply-section-heading">
                  <FileText size={18} />
                  Selected Role
                </div>
                <p>
                  <strong>Job Role:</strong> {job.jobRole || 'General'}
                </p>
                <p>
                  <strong>Job Description:</strong> {job.jobDescription}
                </p>
              </div>
            )}

            <form className="apply-form-grid row g-4" onSubmit={handleSubmit}>
              <div className="col-md-6">
                <label className="apply-field-label">Full name *</label>
                <div className="input-group input-icon-left">
                  <User size={18} className="input-icon" />
                  <input
                    className="form-control form-input"
                    placeholder="Enter your full name"
                    onChange={(e) => updateForm('full_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="apply-field-label">Email *</label>
                <div className="input-group input-icon-left">
                  <Mail size={18} className="input-icon" />
                  <input
                    className="form-control form-input"
                    placeholder="Enter your email address"
                    onChange={(e) => updateForm('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="apply-field-label">Phone *</label>
                <div className="input-group input-icon-left">
                  <Phone size={18} className="input-icon" />
                  <input
                    className="form-control form-input"
                    placeholder="Enter your phone number"
                    onChange={(e) => updateForm('phone', e.target.value)}
                  />
                </div>
              </div>


              <div className="col-md-6">
                <label className="apply-field-label">Location *</label>
                <div className="input-group input-icon-left">
                  <MapPin size={18} className="input-icon" />
                  <input
                    className="form-control form-input"
                    placeholder="Current city or region"
                    onChange={(e) => updateForm('location', e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="apply-field-label">Work Authorization Status *</label>
                <div className="input-group input-icon-left">
                  <ShieldCheck size={18} className="input-icon" />
                  <input
                    className="form-control form-input"
                    placeholder="Enter your work authorization status"
                    onChange={(e) => updateForm('visa', e.target.value)}
                  />
                </div>
              </div>


              <div className="col-md-6">
                <label className="apply-field-label"> key Skills</label>
                <div className="input-group input-icon-left">
                  <Wrench size={18} className="input-icon" />
                  <input
                    className="form-control form-input"
                    placeholder="React, Node.js, SQL"
                    onChange={(e) => updateForm('skills', e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="apply-field-label">Experience</label>
                <div className="input-group input-icon-left">
                  <BriefcaseBusiness size={18} className="input-icon" />
                  <input
                    className="form-control form-input"
                    placeholder="e.g. 2.5 years"
                    onChange={(e) => updateForm('experience', e.target.value)}
                  />
                </div>
              </div>

                <div className="col-md-6">
                <label className="apply-field-label">LinkedIn URL </label>
                <div className="input-group input-icon-left">
                  <Link2 size={18} className="input-icon" />
                  <input
                    className="form-control form-input"
                    placeholder="linkedin.com/in/your-profile"
                    onChange={(e) => {
                      let url = e.target.value;

                      if (url && !url.startsWith('http')) {
                        url = `https://${url}`;
                      }

                      updateForm('linkedin_url', url);
                    }}
                  />
                </div>
              </div>

              <div className="col-12">
                <label className="apply-field-label">Contract</label>
                <small className="apply-upload-help">Select applicable</small>
                <div className="apply-checkbox-grid apply-contract-grid">
                  {['C2C', 'W2', 'FTE'].map((option) => {
                    const checked = (form.contractTypes || []).includes(option);

                    return (
                      <label
                        key={option}
                        className={`apply-checkbox-card${checked ? ' selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleContractType(option)}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="col-12">
                <label className="apply-field-label">Work Preference</label>
                <div className="apply-checkbox-grid">
                  {workPreferenceOptions.map((option) => {
                    const checked = (form.workPreferences || []).includes(option);

                    return (
                      <label
                        key={option}
                        className={`apply-checkbox-card${checked ? ' selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleWorkPreference(option)}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="col-md-6">
                <label className="apply-field-label">Resume *</label>
                <div className="apply-upload-card">
                  <div className="apply-upload-label">
                    <Upload size={18} />
                    Upload your resume
                  </div>
                  <input
                    type="file"
                    className="form-control apply-file-input"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResume(e.target.files[0])}
                  />
                  <small className="apply-upload-help">Allowed: PDF, DOC, DOCX</small>
                </div>
              </div>

              <div className="col-md-6">
                <label className="apply-field-label">Additional document</label>
                <div className="apply-upload-card">
                  <div className="apply-upload-label">
                    <Globe size={18} />
                    Upload supporting document
                  </div>
                  <input
                    type="file"
                    className="form-control apply-file-input"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setExtraFile(e.target.files[0])}
                  />
                  <small className="apply-upload-help">Allowed: PDF, DOC, DOCX</small>
                </div>
              </div>

              <div className="col-12">
                <button className="apply-submit-btn" type="submit">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
