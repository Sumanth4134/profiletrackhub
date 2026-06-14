const API_BASE_URL_ERROR =
  'REACT_APP_API_BASE_URL is required in production. Set it to the backend Vercel URL so API requests do not fall back to the frontend origin.';

export function getConfiguredApiBaseUrl() {
  return process.env.REACT_APP_API_BASE_URL?.trim() || '';
}

export function isProductionBuild() {
  return process.env.NODE_ENV === 'production';
}

export function hasConfiguredApiBaseUrl() {
  return Boolean(getConfiguredApiBaseUrl());
}

export function getApiBaseUrlOrDefault() {
  const configuredBaseUrl = getConfiguredApiBaseUrl();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  if (isProductionBuild()) {
    throw new Error(API_BASE_URL_ERROR);
  }

  if (window.location.port === '3000') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return window.location.origin;
}

export function getApiBaseUrlErrorMessage() {
  return API_BASE_URL_ERROR;
}
