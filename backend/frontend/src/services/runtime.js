function getBrowserOrigin() {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  return window.location.origin;
}

export function getApiBaseUrl() {
  const configuredBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  if (window.location.port === '3000') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return getBrowserOrigin();
}

export function getApiRootUrl() {
  return `${getApiBaseUrl()}/api`;
}

export function getAssetUrl(assetPath = '') {
  if (!assetPath) {
    return '';
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  return `${getApiBaseUrl()}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
}

export function getPublicAppUrl(pathname = '') {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (typeof window === 'undefined') {
    return normalizedPathname;
  }

  if (window.location.port === '3000') {
    return `${getApiBaseUrl()}${normalizedPathname}`;
  }

  return `${getBrowserOrigin()}${normalizedPathname}`;
}
