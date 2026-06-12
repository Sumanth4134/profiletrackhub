import { Navigate, useLocation } from 'react-router-dom';

import { getCurrentAdmin, isAuthenticated } from '../services/authSession';

export default function ProtectedRoute({ allowRoles, allowedRoles, children }) {
  const location = useLocation();
  const admin = getCurrentAdmin();
  const roles = allowRoles || allowedRoles || [];

  if (!isAuthenticated() || !admin) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  if (roles.length && !roles.includes(admin.role)) {
    const fallback = admin.role === 'super_admin' ? '/super-admin/dashboard' : '/admin/dashboard';
    return <Navigate replace to={fallback} />;
  }

  return children;
}
