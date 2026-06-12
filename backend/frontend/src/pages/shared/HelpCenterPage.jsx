import {
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  User
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  createHelpRequest,
  getHelpRequests,
  updateHelpRequestStatus
} from '../../services/api';
import { getCurrentAdmin } from '../../services/authSession';

const requestTypes = ['Password Request', 'Suggestion', 'Query', 'New User Request'];
const statusOptions = ['New', 'In Review', 'Resolved'];

export default function HelpCenterPage() {
  const currentAdmin = getCurrentAdmin();
  const isSuperAdmin = currentAdmin?.role === 'super_admin';
  const [requests, setRequests] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    requestType: 'Query',
    name: currentAdmin?.name || '',
    contactInfo: currentAdmin?.phone || '',
    subject: '',
    message: ''
  });

  const loadRequests = async () => {
    const response = await getHelpRequests();
    setRequests(response.data || []);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const counts = useMemo(() => {
    return requests.reduce(
      (accumulator, request) => {
        accumulator.total += 1;
        accumulator[request.status] = (accumulator[request.status] || 0) + 1;
        return accumulator;
      },
      { total: 0, New: 0, 'In Review': 0, Resolved: 0 }
    );
  }, [requests]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await createHelpRequest(form);
      setForm((current) => ({
        ...current,
        subject: '',
        message: ''
      }));
      await loadRequests();
      alert('Help request submitted successfully.');
    } catch (error) {
      alert(error?.response?.data?.error || 'Unable to submit help request');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (requestId, status) => {
    await updateHelpRequestStatus(requestId, status);
    await loadRequests();
  };

  return (
    <div className="dashboard-shell help-center-shell">
      <div className="dashboard-heading-row">
        <div>
          <div className="workspace-heading">Support Workspace</div>
          <h1 className="dashboard-page-title">Help Center</h1>
          <p className="dashboard-page-copy mb-0">
            {isSuperAdmin
              ? 'Review all support requests, monitor trends, and keep request status updated.'
              : 'Submit support requests and track their progress in one place.'}
          </p>
        </div>
      </div>

      <div className="reference-stats-grid dashboard-stats-grid dashboard-stats-grid-wide">
        {[
          { label: 'Total Requests', value: counts.total, tone: 'blue', icon: LifeBuoy },
          { label: 'New', value: counts.New, tone: 'amber', icon: HelpCircle },
          { label: 'In Review', value: counts['In Review'], tone: 'purple', icon: MessageSquareText },
          { label: 'Resolved', value: counts.Resolved, tone: 'green', icon: Send }
        ].map((card) => {
          const Icon = card.icon;

          return (
            <div className={`reference-stat-card premium-stat-card tone-border-${card.tone}`} key={card.label}>
              <div className={`reference-stat-icon tone-${card.tone}`}>
                <Icon size={24} />
              </div>
              <div className="reference-stat-body">
                <div className="reference-stat-label">{card.label}</div>
                <div className="reference-stat-value">{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="settings-grid help-center-grid">
        {!isSuperAdmin ? (
          <div className="reference-panel">
            <div className="settings-card-header">
              <div className="settings-card-icon tone-blue">
                <HelpCircle size={18} />
              </div>
              <div>
                <h5 className="section-title mb-1">Create Request</h5>
                <p className="section-copy mb-0">Raise access, query, onboarding, or suggestion requests here.</p>
              </div>
            </div>

            <form className="mt-4" onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="reference-label">Request Type</label>
                  <select
                    className="form-select form-select-help"
                    value={form.requestType}
                    onChange={(event) => setForm({ ...form, requestType: event.target.value })}
                  >
                    {requestTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="reference-label">Name</label>
                  <div className="input-group input-icon-left">
                    <User className="input-icon" size={18} />
                    <input
                      className="form-control form-input"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="reference-label">Email / Phone</label>
                  <div className="input-group input-icon-left">
                    {form.contactInfo.includes('@') ? (
                      <Mail className="input-icon" size={18} />
                    ) : (
                      <Phone className="input-icon" size={18} />
                    )}
                    <input
                      className="form-control form-input"
                      placeholder="Email address or phone number"
                      value={form.contactInfo}
                      onChange={(event) => setForm({ ...form, contactInfo: event.target.value })}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="reference-label">Subject</label>
                  <div className="input-group input-icon-left">
                    <LifeBuoy className="input-icon" size={18} />
                    <input
                      className="form-control form-input"
                      placeholder="Summarize your request"
                      value={form.subject}
                      onChange={(event) => setForm({ ...form, subject: event.target.value })}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="reference-label">Message</label>
                  <div className="input-group input-icon-left">
                    <MessageSquareText className="input-icon textarea-icon" size={18} />
                    <textarea
                      className="form-control form-textarea"
                      placeholder="Describe your request in detail"
                      rows="5"
                      value={form.message}
                      onChange={(event) => setForm({ ...form, message: event.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button className="dashboard-action-btn primary mt-4" disabled={saving} type="submit">
                <Send size={16} />
                <span>{saving ? 'Submitting...' : 'Submit Request'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="reference-panel">
            <div className="settings-card-header">
              <div className="settings-card-icon tone-purple">
                <LifeBuoy size={18} />
              </div>
              <div>
                <h5 className="section-title mb-1">Platform Overview</h5>
                <p className="section-copy mb-0">All recruiter help requests flow through this workspace.</p>
              </div>
            </div>
          </div>
        )}

        <div className="reference-panel">
          <div className="settings-card-header">
            <div className="settings-card-icon tone-green">
              <MessageSquareText size={18} />
            </div>
            <div>
              <h5 className="section-title mb-1">{isSuperAdmin ? 'Latest Requests' : 'Your Latest Requests'}</h5>
              <p className="section-copy mb-0">
                {isSuperAdmin ? 'Recent support requests across the whole application.' : 'Your most recent help requests and their current status.'}
              </p>
            </div>
          </div>

          <div className="help-center-inline-list mt-4">
            {requests.slice(0, 5).map((request) => (
              <div className="help-request-card" key={request.id}>
                <div className="help-request-card-head">
                  <div>
                    <strong>{request.subject}</strong>
                    <div className="help-request-meta">
                      <span>{request.request_type}</span>
                      <span>{request.requester_name}</span>
                    </div>
                  </div>
                  <span className={`status-pill help-status-pill status-${String(request.status).toLowerCase().replace(/\s+/g, '-')}`}>
                    {request.status}
                  </span>
                </div>
                <p className="mb-2">{request.message}</p>
                <small>{new Date(request.created_at).toLocaleString()}</small>
              </div>
            ))}

            {requests.length === 0 ? <div className="text-muted">No help requests found.</div> : null}
          </div>
        </div>
      </div>

      <div className="reference-table-card">
        <div className="saved-jobs-head">
          <div>
            <h5 className="section-title mb-1">{isSuperAdmin ? 'All Help Requests' : 'My Help Requests'}</h5>
            <p className="section-copy mb-0">
              {isSuperAdmin ? 'Update statuses for recruiter support tickets.' : 'Track status updates on your own submitted requests.'}
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table reference-table align-middle mb-0">
            <thead>
              <tr>
                <th>Request Type</th>
                <th>Name</th>
                <th>Email / Phone</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.request_type}</td>
                  <td>{request.requester_name}</td>
                  <td>{request.contact_info || request.admin_phone || '-'}</td>
                  <td className="fw-semibold">{request.subject}</td>
                  <td className="help-request-message-cell">{request.message}</td>
                  <td>
                    {isSuperAdmin ? (
                      <select
                        className="form-select form-select-sm dashboard-status-select"
                        value={request.status}
                        onChange={(event) => handleStatusChange(request.id, event.target.value)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`status-pill help-status-pill status-${String(request.status).toLowerCase().replace(/\s+/g, '-')}`}>
                        {request.status}
                      </span>
                    )}
                  </td>
                  <td>{new Date(request.created_at).toLocaleString()}</td>
                </tr>
              ))}

              {requests.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-5" colSpan="7">
                    No help requests available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
