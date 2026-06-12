const PROFILE_KEY = 'profiletrackhub_admin_profile';
const SETTINGS_KEY = 'profiletrackhub_admin_settings';

const defaultProfile = {
  photo: '',
  name: 'Recruiter',
  bio: 'Recruiter'
};

const defaultSettings = {
  phone: '',
  password: ''
};

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch (_error) {
    return fallback;
  }
}

export function getAdminProfile() {
  return readStorage(PROFILE_KEY, defaultProfile);
}

export function saveAdminProfile(profile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event('profiletrackhub-admin-profile-updated'));
}

export function getAdminSettings() {
  return readStorage(SETTINGS_KEY, defaultSettings);
}

export function saveAdminSettings(settings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('profiletrackhub-admin-settings-updated'));
}
