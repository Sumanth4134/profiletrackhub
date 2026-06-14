import { getApiBaseUrlOrDefault } from './apiConfig';

export function getApiBaseUrl() {
  return getApiBaseUrlOrDefault();
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

  return `${window.location.origin}${normalizedPathname}`;
}
