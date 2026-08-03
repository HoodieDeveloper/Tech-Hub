const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (configuredApiUrl || 'http://127.0.0.1:8000/api').replace(
  /\/$/,
  ''
);

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

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

function getErrorMessage(data: ApiErrorBody | null): string {
  if (data?.errors) {
    const firstFieldErrors = Object.values(data.errors)[0];
    if (firstFieldErrors?.length) {
      return firstFieldErrors[0];
    }
  }

  return data?.message ?? 'Something went wrong while contacting the API.';
}

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot reach Laravel at ${API_URL}. Make sure php artisan serve is running.`
    );
  }

  const data = (await response.json().catch(() => null)) as ApiErrorBody | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
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

export function apiPostForm<T>(path: string, body: FormData, auth = true) {
  return apiRequest<T>(path, {
    method: 'POST',
    body,
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
