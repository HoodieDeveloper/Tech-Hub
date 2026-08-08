const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (configuredApiUrl || 'http://127.0.0.1:8000/api').replace(
  /\/$/,
  ''
);

const TOKEN_KEY = 'tech_hub_token';
const USER_KEY = 'tech_hub_user';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  avatar_url: string | null;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}      

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): AuthUser | null {
  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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
      `Cannot reach Laravel at ${API_URL}. Check the selected API URL and server.`
    );
  }

  const data = (await response.json().catch(() => null)) as ApiErrorBody | null;

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      clearAuthSession();
    }

    throw new Error(getErrorMessage(data));
  }

  return data as T;
}

export function apiGet<T>(path: string, auth = true) {
  return apiRequest<T>(path, { method: 'GET', auth });
}

export function apiPost<T>(path: string, body: unknown, auth = true) {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    auth,
  });
}

export function apiPut<T>(path: string, body: unknown, auth = true) {
  return apiRequest<T>(path, {
    method: 'PUT',
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


export function apiDelete<T>(path: string) {
  return apiRequest<T>(path, { method: 'DELETE' });
}
export function apiUpdateForm<T>(
  path: string,
  body: FormData,
  auth = true,
) {
  body.set('_method', 'PUT');

  return apiRequest<T>(path, {
    method: 'POST',
    body,
    auth,
  });
}