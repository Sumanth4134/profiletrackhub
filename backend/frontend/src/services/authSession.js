const SESSION_KEY = 'profiletrackhub_auth_session';

export function getSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

export function saveSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('profiletrackhub-session-updated'));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('profiletrackhub-session-updated'));
}

export function getToken() {
  return getSession()?.token || '';
}

export function getCurrentAdmin() {
  return getSession()?.admin || null;
}

export function isAuthenticated() {
  return Boolean(getToken());
}
