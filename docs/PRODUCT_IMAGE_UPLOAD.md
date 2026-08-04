# Product image upload: React → Laravel → Supabase

The admin chooses an image in the React product form. React sends a
`multipart/form-data` request to Laravel. Laravel validates the image, uploads
it to the public Supabase Storage bucket, stores the generated public URL in
`products.image_url`, and returns the product as JSON.

## 1. Supabase bucket

Create a public bucket named `product-images` with:

- Maximum file size: 5 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

A public bucket allows customers to read product pictures. Upload and delete
operations still use the protected Laravel backend.

## 2. Laravel local environment

Copy `.env.example` to `.env`:

```powershell
cd apps\api-laravel
copy .env.example .env
php artisan key:generate
```

Fill the private values in `.env`:

```env
DB_HOST=YOUR_SUPABASE_POOLER_HOST
DB_USERNAME=postgres.YOUR_PROJECT_REF
DB_PASSWORD=YOUR_DATABASE_PASSWORD

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_YOUR_SERVER_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_LEGACY_SERVICE_ROLE_JWT
SUPABASE_STORAGE_BUCKET=product-images
```

For this raw Storage REST implementation:

- `SUPABASE_SECRET_KEY` is sent in the `apikey` header.
- `SUPABASE_SERVICE_ROLE_KEY` is the legacy JWT sent in the `Authorization`
  header. It normally begins with `eyJ` and contains three dot-separated parts.

Both values belong only in Laravel. Never put them in React or GitHub.

Use these local settings:

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Start Laravel:

```powershell
php artisan config:clear
php artisan serve --host=127.0.0.1 --port=8000
```

Test:

- `http://127.0.0.1:8000/api/health`
- `http://127.0.0.1:8000/api/products`

## 3. React local environment

```powershell
cd apps\web-react
copy .env.example .env.local
npm install
npm run dev
```

`apps/web-react/.env.local` should contain one active value:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Open `http://localhost:5173`, complete the form, choose an image, and click
**Create Product**.

## 4. Confirm the result

- The product card appears in React.
- Supabase Storage → `product-images` contains the uploaded object.
- Supabase Table Editor → `products` contains `image_url` and `image_path`.
- Opening `image_url` in a browser displays the picture.

See [LOCAL_WEB_TEST.md](LOCAL_WEB_TEST.md) for the complete team workflow.
