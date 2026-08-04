# After Downloading the Updated Project

## 1. Laravel backend

```powershell
cd apps\api-laravel
composer install
copy .env.example .env
php artisan key:generate
```

Fill the Supabase database and Storage values in `.env`, then:

```powershell
php artisan config:clear
php artisan serve
```

## 2. React web

```powershell
cd apps\web-react
npm install
copy .env.example .env.local
npm run dev
```

For Railway:

```env
VITE_API_URL=https://tech-hub-production-dd8a.up.railway.app/api
```

For local Laravel:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## 3. Flutter mobile

```powershell
cd apps\mobile-flutter
flutter pub get
flutter run --dart-define=API_BASE_URL=https://tech-hub-production-dd8a.up.railway.app/api
```

## 4. Production database update

After this code is reviewed and merged into `main`, Railway should run:

```bash
php artisan migrate --force
```

This adds/updates the `role` support in the Supabase-hosted `users` table.

## 5. Create the first admin

Run this from a trusted Laravel terminal connected to the production Supabase database:

```bash
php artisan techhub:create-admin admin@example.com --name="TechHub Admin"
```

The command securely asks for the password.

## 6. Test the flow

```text
Guest opens app → products are visible
Guest clicks product → shared login page
Customer login → selected product details
Admin login → web admin dashboard
Customer tries admin API → 403 Forbidden
```
