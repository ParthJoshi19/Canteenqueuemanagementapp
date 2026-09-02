const envBaseUrl = import.meta.env.VITE_API_BASE_URL;

export function apiUrl(path: string) {
  if (envBaseUrl && envBaseUrl.trim() !== '') {
    return new URL(path, envBaseUrl.trim()).toString();
  }
  return path;
}