# Product image upload: React → Laravel → Supabase → Flutter

The admin chooses a local image in the React product form. React sends a
`multipart/form-data` request to Laravel. Laravel validates the image, uploads
it to the public Supabase Storage bucket, saves the generated public URL in the
`products.image_url` column, and returns the new product as JSON. Flutter reads
that same JSON and displays the URL with `Image.network`.

## 1. Supabase

Create a public bucket named `product-images` with:

- Maximum file size: 5 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

## 2. Laravel `.env`

Copy `.env.example` to `.env`, keep your existing PostgreSQL settings, and add:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_server_key
SUPABASE_STORAGE_BUCKET=product-images
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

The secret key belongs only in Laravel. Do not put it in React, Flutter, GitHub,
or the Android APK. A legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported.

Run:

```powershell
cd apps\api-laravel
php artisan optimize:clear
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000
```

## 3. React

```powershell
cd apps\web-react
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`, complete the product form, choose an image, and
click **Create Product**. You should see the image immediately in the web list.

## 4. Confirm Supabase and database

- Supabase Storage → `product-images` → `products/...` contains the new file.
- Table Editor → `products` contains the generated public `image_url`.
- Opening that URL in a browser displays the image.

## 5. Flutter emulator

```powershell
cd apps\mobile-flutter
flutter pub get
flutter run
```

The Android emulator uses `http://10.0.2.2:8000/api`. Pull down on the product
screen to refresh. It loads the same `image_url` returned by Laravel.

For a real phone on the same Wi-Fi:

```powershell
ipconfig
flutter run --dart-define=API_BASE_URL=http://YOUR_PC_IPV4:8000/api
```
