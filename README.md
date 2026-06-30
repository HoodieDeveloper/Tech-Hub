# Tech Hub Monorepo Starter

Clean starter structure for:

```text
React Web App  -> Laravel API -> Supabase PostgreSQL
Flutter App    -> Laravel API -> Supabase PostgreSQL
```

## Folder structure

```text
tech-hub/
├── apps/
│   ├── web-react/        # React + Vite frontend starter
│   ├── mobile-flutter/   # Flutter mobile starter
│   └── api-laravel/      # Laravel API custom code layer
├── docs/
├── supabase/
│   └── migrations/
├── .github/
│   └── CODEOWNERS
├── .gitignore
└── README.md
```

## Important first step

This zip contains a clean starter structure and custom code files. It does **not** include heavy generated folders like:

- `node_modules/`
- Laravel `vendor/`
- Flutter `android/`, `ios/`, `build/`

You generate/install those on your computer.

---

## 1. Supabase database

Create a Supabase project, then get the Session Pooler connection values:

```env
DB_CONNECTION=pgsql
DB_HOST=your-supabase-pooler-host
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.your-project-ref
DB_PASSWORD=your-database-password
```

Put these values in:

```text
apps/api-laravel/.env
```

Never push `.env` to GitHub.

---

## 2. Laravel API setup

Because this starter does not include Laravel framework files, create the Laravel app first:

```powershell
cd apps
composer create-project laravel/laravel api-laravel-real
```

Then copy the files from this starter folder:

```text
apps/api-laravel/
```

into your real Laravel folder:

```text
apps/api-laravel-real/
```

After copying, rename `api-laravel-real` to `api-laravel`.

Then run:

```powershell
cd apps/api-laravel
composer require laravel/sanctum
php artisan sanctum:install
php artisan migrate
php artisan serve
```

Your API will run at:

```text
http://127.0.0.1:8000/api
```

---

## 3. React setup

```powershell
cd apps/web-react
npm install
npm run dev
```

Create `.env` from `.env.example`:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

---

## 4. Flutter setup

If you want Android/iOS generated folders, run this inside `apps/`:

```powershell
flutter create mobile-flutter
```

Then keep/copy the `lib/` folder from this starter.

Run:

```powershell
cd apps/mobile-flutter
flutter pub get
flutter run
```

For Android emulator, use this API base URL:

```dart
static const String baseUrl = 'http://10.0.2.2:8000/api';
```

For real Android phone on same Wi-Fi, use your laptop IP:

```dart
static const String baseUrl = 'http://YOUR_LAPTOP_IP:8000/api';
```

---

## 5. API idea

```text
React Web App       Flutter Android App
      |                    |
      +------ Laravel API -+
                  |
           Supabase Database
```

Both web and mobile update the same data because both use the same Laravel API.
