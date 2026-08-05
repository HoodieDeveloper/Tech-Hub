# Local Web Upload Fix

## Problems found

1. React had multiple active `VITE_API_URL` definitions in `.env` and `.env.local`.
2. The local Laravel `.env` was configured like production, which hid useful errors and used database cache/session drivers.
3. Supabase Storage headers were inconsistent between `sb_secret_...` and the legacy `service_role` JWT.
4. Product API tests still used old Supabase config names and did not test the real headers.
5. Upload failures returned only a generic server error.

## Fixes applied

- React now has one local API value in `.env.local`.
- Laravel local defaults use `APP_ENV=local`, debug logging, file cache, and file sessions.
- Storage upload sends:
  - `apikey: SUPABASE_SECRET_KEY` (or service role as fallback)
  - `Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY`
- Added `GET /api/health` with safe, non-secret diagnostics.
- Added clear JSON messages for Supabase upload errors.
- Corrected the feature tests and added failure/health tests.
- Added `docs/LOCAL_WEB_TEST.md` and `scripts/setup-local-web.ps1`.

## First test

Fill private placeholders in `apps/api-laravel/.env`, then run:

```powershell
# Terminal 1
cd apps\api-laravel
php artisan config:clear
php artisan serve --host=127.0.0.1 --port=8000
```

Open:

```text
http://127.0.0.1:8000/api/health
or
http://................./api/health
```

Then:

```powershell
# Terminal 2
cd apps\web-react
npm install
npm run dev
```

Open `http://localhost:5173`. The page should show the local API URL.

## Security

The returned project does not contain the real database password or Supabase keys. Rotate the credentials that were previously pasted or included in shared files, then put the new values only in Laravel `.env` and Railway Variables.
