# Test TechHub Web Locally

This setup runs the React and Laravel code from the current Git branch on your computer, while Laravel connects to the shared online Supabase database and Storage.

## 1. Prepare Laravel once

```powershell
cd apps\api-laravel
copy .env.example .env
composer install
php artisan key:generate
```

Open `apps/api-laravel/.env` and fill these private values:

```env
DB_HOST=...
DB_USERNAME=...
DB_PASSWORD=...
SUPABASE_URL=...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=product-images
```

Keep these local values:

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

Never commit `.env`.

## 2. Prepare React once

```powershell
cd apps\web-react
copy .env.example .env.local
npm install
```

The local React setting is:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Never put database or Supabase server secrets in React.

## 3. Start local Laravel

Open terminal 1:

```powershell
cd apps\api-laravel
php artisan config:clear
php artisan serve --host=127.0.0.1 --port=8000
```

Test these URLs:

- `http://127.0.0.1:8000/api/health`
- `http://127.0.0.1:8000/api/products`

The health response should show:

```json
{
  "status": "ok",
  "database": "connected",
  "storage": {
    "api_key_configured": true,
    "service_role_configured": true,
    "service_role_looks_like_jwt": true,
    "bucket": "product-images"
  }
}
```

The health route never returns the actual keys.

## 4. Start React

Open terminal 2:

```powershell
cd apps\web-react
npm run dev
```

Open `http://localhost:5173`.

The page must display:

```text
Connected API: http://127.0.0.1:8000/api/products
```

Create a test product and choose a JPG, PNG, or WEBP image.

## 5. When an upload fails

The web page now shows Supabase's real error message instead of only `Server Error`.

Also check the Laravel terminal or run:

```powershell
Get-Content .\storage\logs\laravel.log -Tail 80
```

Common health results:

- `database: failed`: check `DB_HOST`, `DB_USERNAME`, and `DB_PASSWORD`.
- `service_role_configured: false`: add `SUPABASE_SERVICE_ROLE_KEY`.
- `service_role_looks_like_jwt: false`: the service-role value is not the legacy JWT beginning with `eyJ...`.

## Team rule

Each member can run their own branch locally with these same commands. They may use the shared Supabase, but they should not run `php artisan migrate` unless the team owner approves the database change.
