import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AllUsers from './pages/admin/AllUsers';
import AdminProfile from './pages/admin/AdminProfile';
import CreateJob from './pages/admin/CreateJob';
import Dashboard from './pages/admin/Dashboard';
import Jobs from './pages/admin/Jobs';
import ProfileView from './pages/admin/ProfileView';
import CreateLink from './pages/admin/createLink';
import Login from "./pages/auth/Login";
import CandidateForm from './pages/public/candidateForm';
import JobsPublic from './pages/public/JobsPublic';
import Success from './pages/public/Success';
import HelpCenterPage from './pages/shared/HelpCenterPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import SettingsPage from './pages/settings/Settings';
import AdminsPage from './pages/super-admin/Admins';
import AdsManagement from './pages/super-admin/AdsManagement';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import SuperAdminJobs from './pages/super-admin/Jobs';
import SuperAdminProfiles from './pages/super-admin/Profiles';
import { getCurrentAdmin, isAuthenticated } from './services/authSession';

function HomeRedirect() {
  const admin = getCurrentAdmin();

  if (!isAuthenticated() || !admin) {
    return <Navigate replace to="/login" />;
  }

  return <Navigate replace to={admin.role === 'super_admin' ? '/super-admin/dashboard' : '/admin/dashboard'} />;
}

function RouteRedirect({ to }) {
  return <Navigate replace to={to} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<HomeRedirect />} path="/" />
        <Route element={<Login />} path="/login" />
        <Route element={<JobsPublic />} path="/jobs" />
        <Route element={<JobsPublic />} path="/jobs/roles/:roleName" />
        <Route element={<JobsPublic />} path="/apply/jobs" />
        <Route element={<CandidateForm />} path="/jobs/:slug" />
        <Route element={<CandidateForm />} path="/apply" />
        <Route element={<Success />} path="/success" />

        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
          path="/admin/dashboard"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <Layout>
                <AllUsers />
              </Layout>
            </ProtectedRoute>
          }
          path="/admin/profiles"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <RouteRedirect to="/admin/profiles" />
            </ProtectedRoute>
          }
          path="/admin/candidates"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <Layout>
                <ProfileView />
              </Layout>
            </ProtectedRoute>
          }
          path="/admin/profiles/:id"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <RouteRedirect to="/admin/profiles" />
            </ProtectedRoute>
          }
          path="/admin/candidates/:id"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <Layout>
                <CreateLink />
              </Layout>
            </ProtectedRoute>
          }
          path="/create-link"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <Layout>
                <Jobs />
              </Layout>
            </ProtectedRoute>
          }
          path="/admin/jobs"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <RouteRedirect to="/admin/jobs" />
            </ProtectedRoute>
          }
          path="/admin/jobs/:id"
        />
        <Route
          path="/admin/create-job"
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <RouteRedirect to="/admin/jobs/create" />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <Layout>
                <CreateJob />
              </Layout>
            </ProtectedRoute>
          }
          path="/admin/jobs/create"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <RouteRedirect to="/admin/jobs/create" />
            </ProtectedRoute>
          }
          path="/jobs/create"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
          path="/admin/settings"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <Layout>
                <AdminProfile />
              </Layout>
            </ProtectedRoute>
          }
          path="/admin/profile"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <Layout>
                <HelpCenterPage />
              </Layout>
            </ProtectedRoute>
          }
          path="/help-center"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          }
          path="/notifications"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['admin', 'super_admin']}>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          }
          path="/admin/notifications"
        />

        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <SuperAdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/dashboard"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/workspace"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/admin-dashboard"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <RouteRedirect to="/admin/jobs/create" />
            </ProtectedRoute>
          }
          path="/super-admin/create-job"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <RouteRedirect to="/admin/jobs/create" />
            </ProtectedRoute>
          }
          path="/super-admin/jobs/create"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <Jobs />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/saved-jobs"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <Jobs />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/my-jobs"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <CreateLink />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/public-links"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <AllUsers />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/candidates"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <ProfileView />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/candidates/:id"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/notifications"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <AdminsPage />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/admins"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <AdsManagement />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/ads"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <SuperAdminJobs />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/jobs"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <SuperAdminProfiles />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/profiles"
        />
        <Route
          element={
            <ProtectedRoute allowRoles={['super_admin']}>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
          path="/super-admin/settings"
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
