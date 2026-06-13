import axios from 'axios';

import { clearSession, getToken, saveSession } from './authSession';
import { getApiRootUrl } from './runtime';

const API = axios.create({
  baseURL: getApiRootUrl()
});

API.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession();
    }

    return Promise.reject(error);
  }
);

export const adminLogin = async (payload) => {
  const response = await API.post('/auth/admin-login', payload);
  saveSession(response.data);
  return response;
};

export const requestPassword = (payload) => API.post('/auth/request-password', payload);
export const logout = () => API.post('/auth/logout');
export const getSessionProfile = () => API.get('/auth/me');
export const changePassword = (payload) => API.post('/auth/change-password', payload);
export const updateAdminProfile = (payload) => API.put('/auth/profile', payload);

export const getAdminDashboard = () => API.get('/admin/dashboard');
export const getAdminJobs = () => API.get('/admin/jobs');
export const createJob = (payload) => API.post('/admin/jobs', payload);
export const updateJob = (id, payload) => API.put(`/admin/jobs/${id}`, payload);
export const deleteJob = (id) => API.delete(`/admin/jobs/${id}`);
export const getJobRoles = () => API.get('/job-roles');
export const createJobRole = (payload) => API.post('/job-roles', payload);

export const getAdminProfiles = (params = {}) => API.get('/admin/profiles', { params });
export const getAdminProfileById = (id) => API.get(`/admin/profiles/${id}`);
export const updateAdminProfileStatus = (id, status) =>
  API.patch(`/admin/profiles/${id}/status`, { status });
export const deleteAdminProfileRecord = (id) => API.delete(`/admin/profiles/${id}`);
export const exportAdminProfilesCsv = async (params = {}) => {
  const response = await API.get('/admin/profiles/export-csv', {
    params,
    responseType: 'blob'
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = 'admin-profiles.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};
export const exportAdminProfilesExcel = async (params = {}) => {
  const response = await API.get('/admin/profiles/export-excel', {
    params,
    responseType: 'blob'
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = 'admin-profiles.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};
export const getNotifications = (params = {}) => API.get('/notifications', { params });
export const getUnreadNotificationsCount = () => API.get('/notifications/unread-count');
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.patch('/notifications/mark-all-read');
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);
export const clearReadNotifications = () => API.delete('/notifications/clear-read');
export const getHelpRequests = () => API.get('/help-requests');
export const createHelpRequest = (payload) => API.post('/help-requests', payload);
export const updateHelpRequestStatus = (id, status) =>
  API.patch(`/help-requests/${id}/status`, { status });

export const getSuperAdminDashboard = () => API.get('/super-admin/dashboard');
export const getSuperAdminsList = () => API.get('/super-admin/admins');
export const createAdminAccount = (payload) => API.post('/super-admin/admins', payload);
export const updateAdminAccount = (id, payload) => API.put(`/super-admin/admins/${id}`, payload);
export const updateAdminRole = (id, role) => API.patch(`/admins/${id}/role`, { role });
export const resetAdminPassword = (id) => API.post(`/super-admin/admins/${id}/reset-password`);
export const getSuperAdminJobs = () => API.get('/super-admin/jobs');
export const getSuperAdminProfiles = () => API.get('/super-admin/profiles');
export const deleteSuperAdminProfile = (id) => API.delete(`/super-admin/profiles/${id}`);
export const getSuperAdminAds = () => API.get('/super-admin/ads');
export const createSuperAdminAd = (formData) =>
  API.post('/super-admin/ads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const deleteSuperAdminAd = (id) => API.delete(`/super-admin/ads/${id}`);
export const getPasswordRequests = () => API.get('/super-admin/password-requests');
export const resolvePasswordRequest = (id) => API.put(`/super-admin/password-requests/${id}/resolve`);

export const getPublicJob = (slug) => API.get(`/public/jobs/${slug}`);
export const getPublicJobById = (id) => API.get(`/public/jobs/by-id/${id}`);
export const getPublicJobs = () => API.get('/public/jobs');
export const getPublicJobRoles = () => API.get('/public/job-roles');
export const getPublicAds = (page) => API.get('/public/ads', { params: { page } });
export const getPublicJobsByRole = (roleName) =>
  API.get(`/public/jobs/by-role/${encodeURIComponent(roleName)}`);
export const submitPublicApplication = (slug, formData) =>
  API.post(`/public/jobs/${slug}/apply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export default API;
