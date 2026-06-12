import {
  ArrowLeft,
  BriefcaseBusiness,
  Download,
  ExternalLink,
  Eye,
  FileBadge2,
  FileText,
  Link2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Wrench,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getAdminProfileById } from '../../services/api';
import { getCurrentAdmin } from '../../services/authSession';
import { getAssetUrl } from '../../services/runtime';

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="candidate-detail-item">
      <div className="candidate-detail-icon">
        <Icon size={16} />
      </div>
      <div className="candidate-detail-copy">
        <div className="candidate-detail-label">{label}</div>
        <div className="candidate-detail-value">{value || '-'}</div>
      </div>
    </div>
  );
}

export default function ProfileView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isSuperAdmin = getCurrentAdmin()?.role === 'super_admin';
  const backRoute = isSuperAdmin ? '/super-admin/candidates' : '/admin/profiles';
  const [data, setData] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const response = await getAdminProfileById(id);
      setData(response.data);
    }

    loadProfile();
  }, [id]);

  const resumeUrl = useMemo(
    () => getAssetUrl(data?.resume_url),
    [data?.resume_url]
  );
  const resumeName = useMemo(() => {
    if (!data?.resume_url) {
      return '';
    }

    return data.resume_url.split('/').pop() || 'resume';
  }, [data?.resume_url]);
  const isPdfResume = useMemo(() => /\.pdf$/i.test(resumeName), [resumeName]);
  const isDocResume = useMemo(() => /\.(doc|docx)$/i.test(resumeName), [resumeName]);
  const resumePreviewUrl = useMemo(
    () => getAssetUrl(data?.resume_preview_url || (isPdfResume ? data?.resume_url : '')),
    [data?.resume_preview_url, data?.resume_url, isPdfResume]
  );

  const handlePreviewResume = () => {
    if (!resumeUrl) {
      return;
    }

    setPreviewOpen(true);
  };

  if (!data) {
    return (
      <div className="dashboard-shell">
        <div className="reference-panel">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell candidate-profile-shell">
      <div className="jobs-page-topbar">
        <button className="back-link-btn" onClick={() => navigate(backRoute)} type="button">
          <ArrowLeft size={16} />
          Back to Profiles
        </button>
      </div>

      <section className="candidate-profile-page">
        <div className="candidate-profile-hero">
          <div className="candidate-profile-hero-main">
            <div className="candidate-profile-avatar">
              <UserRound size={28} />
            </div>
            <div className="candidate-profile-hero-copy">
              <p className="candidate-profile-kicker">Candidate Profile</p>
              <h1 className="candidate-profile-name">{data.full_name}</h1>
              <div className="candidate-profile-role-line">
                <span>{data.job_title || 'No selected job title'}</span>
                <span className="candidate-profile-separator">•</span>
                <span>{data.job_role || 'General'}</span>
              </div>
            </div>
          </div>

          <span
            className={`status-pill ${
              data.status === 'Interview Process'
                ? 'status-interview'
                : data.status === 'Shortlisted'
                  ? 'status-shortlisted'
                  : data.status === 'Selected'
                    ? 'status-selected'
                    : 'status-new'
            }`}
          >
            {data.status}
          </span>
        </div>

        <div className="candidate-profile-grid row g-4">
          <div className="col-xl-6">
            <div className="candidate-info-card">
              <div className="candidate-card-heading">
                <h5 className="section-title mb-1">Candidate Details</h5>
                <p className="section-copy mb-0">
                  Contact, background, and work preference details captured during application.
                </p>
              </div>

              <div className="candidate-detail-grid">
                <DetailItem icon={Mail} label="Email" value={data.email} />
                <DetailItem icon={Phone} label="Phone" value={data.phone} />
                <DetailItem icon={MapPin} label="Current Location" value={data.location} />
                <DetailItem icon={BriefcaseBusiness} label="Experience" value={data.experience} />
                <DetailItem icon={Wrench} label="Skills" value={data.skills} />
                <DetailItem icon={ShieldCheck} label="Visa Status" value={data.visa} />
                <DetailItem
                  icon={FileBadge2}
                  label="Work Preference"
                  value={data.work_preference || data.hybrid}
                />
                <DetailItem icon={BriefcaseBusiness} label="Contract Type" value={data.contract_type} />
                <DetailItem icon={Link2} label="LinkedIn URL" value={data.linkedin_url} />
              </div>
            </div>
          </div>

          <div className="col-xl-6">
            <div className="candidate-info-card">
              <div className="candidate-card-heading">
                <h5 className="section-title mb-1">Role Details</h5>
                <p className="section-copy mb-0">
                  Job context, recruiter-facing links, and resume actions for this application.
                </p>
              </div>

              <div className="candidate-detail-grid">
                <DetailItem
                  icon={MapPin}
                  label="Job Location"
                  value={data.job_location || 'Location not specified'}
                />
                <DetailItem icon={BriefcaseBusiness} label="Job Role" value={data.job_role || 'General'} />
                <DetailItem icon={FileText} label="Preferred Role / Job Title" value={data.preferred_role || data.job_title} />
                <DetailItem icon={FileBadge2} label="Application Source" value={data.source || 'Public Job Link'} />
              </div>

              <div className="candidate-action-stack">
                <a
                  className="candidate-action-link"
                  href={
                    data.linkedin_url?.startsWith('http')
                      ? data.linkedin_url
                      : `https://${data.linkedin_url}`
                  }
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink size={16} />
                  <span>Open LinkedIn</span>
                </a>

                {resumeUrl ? (
                  <div className="candidate-resume-actions">
                    <button
                      className="candidate-action-link"
                      onClick={handlePreviewResume}
                      type="button"
                    >
                      <Eye size={16} />
                      <span>Preview Resume</span>
                    </button>

                    <a
                      className="candidate-action-link"
                      href={resumeUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Download size={16} />
                      <span>Download Resume</span>
                    </a>
                  </div>
                ) : (
                  <div className="candidate-empty-note">No resume uploaded</div>
                )}

                {data.extra_file ? (
                  <a
                    className="candidate-action-link"
                    href={getAssetUrl(data.extra_file)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <FileText size={16} />
                    <span>Download Additional Document</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {data.job_description ? (
            <div className="col-12">
              <div className="candidate-description-card">
                <div className="candidate-card-heading">
                  <h5 className="section-title mb-1">Job Description</h5>
                  <p className="section-copy mb-0">
                    Original role description that was shown to the candidate during application.
                  </p>
                </div>
                <p className="candidate-description-copy mb-0">{data.job_description}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {previewOpen ? (
        <div className="resume-preview-overlay" onClick={() => setPreviewOpen(false)} role="presentation">
          <div className="resume-preview-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="resume-preview-header">
              <div>
                <h5 className="section-title mb-1">Resume Preview</h5>
                <p className="section-copy mb-0">{resumeName || 'Candidate resume'}</p>
                {resumePreviewUrl ? (
                  <small className="resume-preview-note">Use Ctrl + F to search inside preview.</small>
                ) : null}
              </div>
              <button className="resume-preview-close" onClick={() => setPreviewOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="resume-preview-body">
              {resumeUrl ? (
                resumePreviewUrl ? (
                  <iframe className="resume-preview-frame" src={resumePreviewUrl} title="Resume Preview" />
                ) : isDocResume ? (
                  <div className="resume-preview-fallback">
                    <FileText size={36} />
                    <h6>{resumeName}</h6>
                    <p className="mb-3">
                      Preview not available for this file type. Please download to view original format.
                    </p>
                    <a className="dashboard-action-btn primary" href={resumeUrl} rel="noreferrer" target="_blank">
                      <Download size={16} />
                      <span>Download Resume</span>
                    </a>
                  </div>
                ) : (
                  <div className="resume-preview-fallback">
                    <FileText size={36} />
                    <h6>{resumeName}</h6>
                    <p className="mb-3">
                      Preview not available for this file type. Please download to view original format.
                    </p>
                    <a className="dashboard-action-btn primary" href={resumeUrl} rel="noreferrer" target="_blank">
                      <Download size={16} />
                      <span>Download Resume</span>
                    </a>
                  </div>
                )
              ) : (
                <div className="resume-preview-fallback">
                  <FileText size={36} />
                  <h6>No resume uploaded</h6>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
