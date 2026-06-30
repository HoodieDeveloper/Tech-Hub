const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

export function getToken() {
  return localStorage.getItem('tech_hub_token');
}

export function setToken(token: string) {
  localStorage.setItem('tech_hub_token', token);
}

export function clearToken() {
  localStorage.removeItem('tech_hub_token');
}

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message ?? 'Something went wrong';
    throw new Error(message);
  }

  return data as T;
}

export function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body: unknown, auth = true) {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    auth,
  });
}

export function apiPut<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function apiDelete<T>(path: string) {
  return apiRequest<T>(path, { method: 'DELETE' });
}
