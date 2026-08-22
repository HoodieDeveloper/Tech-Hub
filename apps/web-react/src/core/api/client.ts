const configuredApiUrl =
  import.meta.env.VITE_API_URL?.trim();

export const API_URL = (
  configuredApiUrl ||
  'http://127.0.0.1:8000/api'
).replace(/\/$/, '');

const TOKEN_KEY =
  'tech_hub_token';

const USER_KEY =
  'tech_hub_user';

export type AuthUser = {
  id: number;

  name: string;

  email: string;

  role:
    | 'admin'
    | 'customer';

  avatar_url:
    | string
    | null;
};

/*
 * =========================================
 * TOKEN
 * =========================================
 */

export function getToken() {
  return localStorage.getItem(
    TOKEN_KEY,
  );
}

export function setToken(
  token: string,
) {
  localStorage.setItem(
    TOKEN_KEY,
    token,
  );
}

/*
 * =========================================
 * STORED USER
 * =========================================
 */

export function getStoredUser():
  | AuthUser
  | null {
  const value =
    localStorage.getItem(
      USER_KEY,
    );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      value,
    ) as AuthUser;
  } catch {
    localStorage.removeItem(
      USER_KEY,
    );

    return null;
  }
}

/*
 * Update only the stored user.
 *
 * We will use this after
 * updating the customer profile.
 */
export function setStoredUser(
  user: AuthUser,
) {
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(
      user,
    ),
  );
}

/*
 * =========================================
 * AUTH SESSION
 * =========================================
 */

export function setAuthSession(
  token: string,
  user: AuthUser,
) {
  localStorage.setItem(
    TOKEN_KEY,
    token,
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(
      user,
    ),
  );
}

export function clearAuthSession() {
  localStorage.removeItem(
    TOKEN_KEY,
  );

  localStorage.removeItem(
    USER_KEY,
  );
}

/*
 * =========================================
 * API TYPES
 * =========================================
 */

type ApiOptions =
  RequestInit & {
    auth?: boolean;
  };

type ApiErrorBody = {
  message?: string;

  errors?: Record<
    string,
    string[]
  >;
};

/*
 * =========================================
 * API ERROR MESSAGE
 * =========================================
 */

function getErrorMessage(
  data:
    | ApiErrorBody
    | null,
): string {
  if (
    data?.errors
  ) {
    const firstFieldErrors =
      Object.values(
        data.errors,
      )[0];

    if (
      firstFieldErrors?.length
    ) {
      return firstFieldErrors[0];
    }
  }

  return (
    data?.message ??
    'Something went wrong while contacting the API.'
  );
}

/*
 * =========================================
 * MAIN API REQUEST
 * =========================================
 */

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const headers =
    new Headers(
      options.headers,
    );

  headers.set(
    'Accept',
    'application/json',
  );

  /*
   * Do not manually set
   * Content-Type for FormData.
   *
   * Browser will automatically
   * create the multipart boundary.
   */
  if (
    !(
      options.body instanceof
      FormData
    )
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    );
  }

  /*
   * Add Bearer token for
   * authenticated API requests.
   */
  if (
    options.auth !== false
  ) {
    const token =
      getToken();

    if (token) {
      headers.set(
        'Authorization',
        `Bearer ${token}`,
      );
    }
  }

  let response: Response;

  try {
    response =
      await fetch(
        `${API_URL}${path}`,
        {
          ...options,
          headers,
        },
      );
  } catch {
    throw new Error(
      `Cannot reach Laravel at ${API_URL}. Check the selected API URL and server.`,
    );
  }

  const data =
    (
      await response
        .json()
        .catch(
          () => null,
        )
    ) as
      | ApiErrorBody
      | null;

  if (
    !response.ok
  ) {
    /*
     * Authentication expired
     * or token is invalid.
     */
    if (
      response.status ===
        401 &&
      options.auth !==
        false
    ) {
      clearAuthSession();
    }

    throw new Error(
      getErrorMessage(
        data,
      ),
    );
  }

  return data as T;
}

/*
 * =========================================
 * GET
 * =========================================
 */

export function apiGet<T>(
  path: string,
  auth = true,
) {
  return apiRequest<T>(
    path,
    {
      method:
        'GET',

      auth,
    },
  );
}

/*
 * =========================================
 * POST JSON
 * =========================================
 */

export function apiPost<T>(
  path: string,
  body: unknown,
  auth = true,
) {
  return apiRequest<T>(
    path,
    {
      method:
        'POST',

      body:
        JSON.stringify(
          body,
        ),

      auth,
    },
  );
}

/*
 * =========================================
 * PUT JSON
 * =========================================
 */

export function apiPut<T>(
  path: string,
  body: unknown,
  auth = true,
) {
  return apiRequest<T>(
    path,
    {
      method:
        'PUT',

      body:
        JSON.stringify(
          body,
        ),

      auth,
    },
  );
}

/*
 * =========================================
 * PATCH JSON
 * =========================================
 */

export function apiPatch<T>(
  path: string,
  body: unknown,
  auth = true,
) {
  return apiRequest<T>(
    path,
    {
      method:
        'PATCH',

      body:
        JSON.stringify(
          body,
        ),

      auth,
    },
  );
}

/*
 * =========================================
 * POST FORM DATA
 * =========================================
 *
 * Used for:
 * - registration with avatar
 * - profile update with avatar
 */

export function apiPostForm<T>(
  path: string,
  body: FormData,
  auth = true,
) {
  return apiRequest<T>(
    path,
    {
      method:
        'POST',

      body,

      auth,
    },
  );
}

/*
 * =========================================
 * DELETE
 * =========================================
 */

export function apiDelete<T>(
  path: string,
) {
  return apiRequest<T>(
    path,
    {
      method:
        'DELETE',
    },
  );
}

/*
 * =========================================
 * UPDATE FORM DATA
 * =========================================
 *
 * Sends POST with:
 *
 * _method = PUT
 *
 * Useful for Laravel file uploads
 * when updating resources.
 */

export function apiUpdateForm<T>(
  path: string,
  body: FormData,
  auth = true,
) {
  body.set(
    '_method',
    'PUT',
  );

  return apiRequest<T>(
    path,
    {
      method:
        'POST',

      body,

      auth,
    },
  );
}