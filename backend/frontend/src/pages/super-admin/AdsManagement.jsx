import { ImagePlus, Link2, Megaphone, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { createSuperAdminAd, deleteSuperAdminAd, getSuperAdminAds } from '../../services/api';
import { getAssetUrl } from '../../services/runtime';

const initialForm = {
  title: '',
  description: '',
  imageUrl: '',
  imageFile: null,
  targetPage: 'both',
  status: 'Active',
  startDate: '',
  endDate: '',
  linkUrl: ''
};

const targetPageLabels = {
  recruiter_dashboard: 'Recruiter Dashboard',
  public_jobs: 'Public Jobs Page',
  both: 'Both'
};

export default function AdsManagement() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const loadAds = async () => {
    const response = await getSuperAdminAds();
    setAds(response.data || []);
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('imageUrl', form.imageUrl);
      payload.append('targetPage', form.targetPage);
      payload.append('status', form.status);
      payload.append('startDate', form.startDate);
      payload.append('endDate', form.endDate);
      payload.append('linkUrl', form.linkUrl);

      if (form.imageFile) {
        payload.append('imageFile', form.imageFile);
      }

      await createSuperAdminAd(payload);
      setForm(initialForm);
      await loadAds();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) {
      return;
    }

    await deleteSuperAdminAd(adId);
    await loadAds();
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading-row">
        <div>
          <div className="workspace-heading">Promotion Control</div>
          <h1 className="dashboard-page-title">Ads Management</h1>
          <p className="dashboard-page-copy mb-0">
            Publish promotional banners for the recruiter dashboard, public jobs page, or both.
          </p>
        </div>
      </div>

      <div className="settings-grid ads-management-grid">
        <section className="reference-table-card">
          <div className="saved-jobs-head">
            <div className="candidate-cell">
              <div className="settings-card-icon tone-blue">
                <Megaphone size={18} />
              </div>
              <div>
                <h5 className="section-title mb-1">Create Ad</h5>
                <p className="section-copy mb-0">Use either an uploaded image or a hosted image URL.</p>
              </div>
            </div>
          </div>

          <form className="row g-3 mt-1" onSubmit={handleSubmit}>
            <div className="col-md-6">
              <label className="reference-label">Ad title</label>
              <input
                className="form-control reference-input"
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="reference-label">Target page</label>
              <select
                className="form-select reference-input"
                value={form.targetPage}
                onChange={(event) => setForm({ ...form, targetPage: event.target.value })}
              >
                <option value="recruiter_dashboard">Recruiter Dashboard</option>
                <option value="public_jobs">Public Jobs Page</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="col-12">
              <label className="reference-label">Ad description</label>
              <textarea
                className="form-control reference-input"
                required
                rows="4"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="reference-label">Image upload</label>
              <input
                accept=".png,.jpg,.jpeg,.webp,.gif"
                className="form-control reference-input"
                type="file"
                onChange={(event) => setForm({ ...form, imageFile: event.target.files?.[0] || null })}
              />
            </div>

            <div className="col-md-6">
              <label className="reference-label">Image URL</label>
              <input
                className="form-control reference-input"
                placeholder="https://example.com/banner.jpg"
                value={form.imageUrl}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              />
            </div>

            <div className="col-md-4">
              <label className="reference-label">Status</label>
              <select
                className="form-select reference-input"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="reference-label">Start date</label>
              <input
                className="form-control reference-input"
                required
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
            </div>

            <div className="col-md-4">
              <label className="reference-label">End date</label>
              <input
                className="form-control reference-input"
                required
                type="date"
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </div>

            <div className="col-12">
              <label className="reference-label">Link URL (optional)</label>
              <div className="reference-input-wrap">
                <input
                  className="form-control reference-input pe-5"
                  placeholder="https://example.com"
                  value={form.linkUrl}
                  onChange={(event) => setForm({ ...form, linkUrl: event.target.value })}
                />
                <Link2 className="reference-input-icon" size={18} />
              </div>
            </div>

            <div className="col-12 d-flex justify-content-end">
              <button className="dashboard-action-btn primary" disabled={submitting} type="submit">
                <ImagePlus size={16} />
                <span>{submitting ? 'Saving...' : 'Save Ad'}</span>
              </button>
            </div>
          </form>
        </section>

        <section className="reference-table-card">
          <div className="saved-jobs-head">
            <div>
              <h5 className="section-title mb-1">Current Ads</h5>
              <p className="section-copy mb-0">Review active windows, targeting, and linked creatives.</p>
            </div>
          </div>

          <div className="ads-admin-list">
            {ads.map((ad) => (
              <article className="ads-admin-card" key={ad.id}>
                <div className="ads-admin-card-media">
                  <img
                    alt={ad.title}
                    src={getAssetUrl(ad.image_url)}
                  />
                </div>
                <div className="ads-admin-card-body">
                  <div className="ads-admin-card-top">
                    <div>
                      <h6 className="ads-admin-card-title">{ad.title}</h6>
                      <p className="section-copy mb-1">{ad.description}</p>
                    </div>
                    <span className={`status-pill ${ad.status === 'Active' ? 'status-selected' : 'status-interview'}`}>
                      {ad.status}
                    </span>
                  </div>

                  <div className="ads-admin-meta">
                    <span>{targetPageLabels[ad.target_page] || 'Both'}</span>
                    <span>{ad.start_date} to {ad.end_date}</span>
                    <span>{ad.created_by_name || 'Super Admin'}</span>
                  </div>

                  <div className="ads-admin-actions">
                    {ad.link_url ? (
                      <a className="dashboard-action-btn white" href={ad.link_url} rel="noreferrer" target="_blank">
                        <Link2 size={16} />
                        <span>Open Link</span>
                      </a>
                    ) : null}

                    <button className="dashboard-action-btn white ads-delete-btn" onClick={() => handleDelete(ad.id)} type="button">
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {ads.length === 0 ? (
              <div className="job-public-empty">
                <div className="job-public-empty-icon">
                  <Megaphone size={22} />
                </div>
                <h5 className="mb-2">No ads created yet.</h5>
                <p className="mb-0">Create your first banner to promote hiring campaigns across the platform.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
