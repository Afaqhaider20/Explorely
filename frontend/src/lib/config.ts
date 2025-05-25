export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.warn('NEXT_PUBLIC_API_URL is not set. API requests may fail.');
}

export const getApiUrl = (path: string) => {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}; 