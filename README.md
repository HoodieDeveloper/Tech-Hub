# TechHub

TechHub is one monorepo with a Laravel API, React web app, Flutter mobile app, and Supabase PostgreSQL/Storage.

```text
React Web ─────┐
               ├── Laravel API on Railway ── Supabase PostgreSQL
Flutter Mobile ┘                         └── Supabase Storage
```

## Access flow

```text
Guest → public product list → click product → shared login
Customer login → customer product details
Admin login → web admin dashboard
```

See [docs/AUTH_ROLES_AND_ACCESS.md](docs/AUTH_ROLES_AND_ACCESS.md) for the full role and route design.

## Project folders

```text
apps/api-laravel/      Laravel backend and role security
apps/web-react/        Public storefront and web admin dashboard
apps/mobile-flutter/   Customer mobile catalog and login flow
docs/                  API and team documentation
```

## Local Laravel

```powershell
cd apps\api-laravel
composer install
copy .env.example .env
php artisan key:generate
php artisan config:clear
php artisan serve
```

The backend `.env` connects Laravel to Supabase PostgreSQL and Storage. Do not commit `.env`.

## Local React using Railway

Create `apps/web-react/.env.local`:

```env
VITE_API_URL=.................
```

Then:

```powershell
cd apps\web-react
npm install
npm run dev
```

## Local React using local Laravel

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Run both `php artisan serve` and `npm run dev`.

## Flutter using Railway

```powershell
cd apps\mobile-flutter
flutter pub get
flutter run --dart-define=API_BASE_URL=....................
```

The mobile code also uses that Railway URL as its default when no `--dart-define` value is supplied.

## Production migration

Railway should run this after approved code is merged into `main`:

```bash
php artisan migrate --force
```

Create the first administrator from a trusted terminal:

```bash
php artisan techhub:create-admin admin@example.com --name="TechHub Admin"
```
