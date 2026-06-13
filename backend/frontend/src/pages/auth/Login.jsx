import { KeyRound, LifeBuoy, LockKeyhole, Phone } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import AppFooter from '../../components/AppFooter';
import { adminLogin, requestPassword } from '../../services/api';
import { getCurrentAdmin, isAuthenticated } from '../../services/authSession';

export default function Login() {
  const navigate = useNavigate();
  const existingAdmin = getCurrentAdmin();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [requestPhone, setRequestPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  if (isAuthenticated() && existingAdmin) {
    return <Navigate replace to={existingAdmin.role === 'super_admin' ? '/super-admin/dashboard' : '/admin/dashboard'} />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await adminLogin(form);
      const nextAdmin = response.data.admin;
      navigate(nextAdmin.role === 'super_admin' ? '/super-admin/dashboard' : '/admin/dashboard');
    } catch (error) {
      alert(error?.response?.data?.error || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRequest = async () => {
    if (!requestPhone.trim()) {
      alert('Enter your recruiter phone number first.');
      return;
    }

    setRequestLoading(true);

    try {
      const response = await requestPassword({ phone: requestPhone });
      alert(response.data.message || 'Password request sent.');
    } catch (error) {
      alert(error?.response?.data?.error || 'Unable to send password request');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-page-card">
        <div className="auth-brand-mark">
          <div className="brand-mark">
            <div className="brand-mark-dot" />
          </div>
          <div>
            <h1 className="auth-brand-title">ProfileTrackHub</h1>
            <p className="auth-brand-copy mb-0">Secure recruiter access for hiring teams</p>
          </div>
        </div>

        <div className="auth-copy-block">
          <div className="apply-page-kicker">
            <KeyRound size={16} />
            Recruiter Login
          </div>
          <h2 className="auth-heading">Access your workspace</h2>
          <p className="auth-subcopy mb-0">
            Candidates do not sign in here. Only super admins and recruiters created inside the system can access the dashboard.
          </p>
        </div>

        <form className="row g-3 mt-1" onSubmit={handleLogin}>
          <div className="col-12">
            <label className="apply-field-label">Phone number</label>
            <div className="input-group input-icon-left">
              <Phone className="input-icon" size={18} />
              <input
                className="form-control form-input"
                placeholder="Enter recruiter phone number"
                value={form.phone}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm({ ...form, phone: value });
                  setRequestPhone(value);
                }}
              />
            </div>
          </div>

          <div className="col-12">
            <label className="apply-field-label">Password</label>
            <div className="input-group input-icon-left">
              <LockKeyhole className="input-icon" size={18} />
              <input
                className="form-control form-input"
                placeholder="Enter password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </div>
          </div>

          <div className="col-12 d-grid gap-3">
            <button className="apply-submit-btn" disabled={loading} type="submit">
              {loading ? 'Signing in...' : 'Login to Dashboard'}
            </button>

            <button className="dashboard-action-btn white justify-content-center" disabled={requestLoading} onClick={handlePasswordRequest} type="button">
              <LifeBuoy size={16} />
              <span>{requestLoading ? 'Sending Request...' : 'Request Password'}</span>
            </button>
          </div>
        </form>
      </div>

      <AppFooter />
    </div>
  );
}
