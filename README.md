# Tech Hub Project Setup Guide

Tech Hub is a monorepo project with React, Laravel, Flutter, and Supabase.

```text
React Web App      → Laravel API → Supabase PostgreSQL Database
Flutter Mobile App → Laravel API → Supabase PostgreSQL Database
```

## Project Structure

```text
tech-hub/
├── apps/
│   ├── web-react/
│   ├── mobile-flutter/
│   └── api-laravel/
├── supabase/
│   └── migrations/
├── .github/
│   └── CODEOWNERS
├── .gitignore
└── README.md
```

---

## 1. Requirements

Before running the project, install these tools:

```text
Git
Node.js
PHP
Composer
Flutter SDK
Android Studio
VS Code
```

Check installation:

```powershell
node -v
npm -v
php -v
composer -V
flutter doctor
```

---

## 2. Clone the Project

```powershell
git clone YOUR_REPOSITORY_LINK_HERE
cd tech-hub
```

---

## 3. Setup Laravel API

Go to Laravel folder:

```powershell
cd apps/api-laravel
```

Install Laravel dependencies:

```powershell
composer install
```

Create `.env` file:

```powershell
copy .env.example .env
```

Generate Laravel app key:

```powershell
php artisan key:generate
```

Open this file:

```text
apps/api-laravel/.env
```

Set the Supabase database connection:

```env
DB_CONNECTION=pgsql
DB_HOST=your_supabase_host
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=your_supabase_username
DB_PASSWORD="your_supabase_password"
```

Example format:

```env
DB_CONNECTION=pgsql
DB_HOST=aws-xxx.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.xxxxxxxxxxxxx
DB_PASSWORD="your_password_here"
```

Clear Laravel cache:

```powershell
php artisan optimize:clear
```

Run database migrations:

```powershell
php artisan migrate
```

Start Laravel API server:

```powershell
php artisan serve
```

Laravel API should run here:

```text
http://127.0.0.1:8000
```

Test the API in browser:

```text
http://127.0.0.1:8000/api/products
```

If it shows `[]` or product data, Laravel API is working.

---

## 4. Setup React Web App

Open a new terminal.

Go to React folder:

```powershell
cd apps/web-react
```

Install dependencies:

```powershell
npm install
```

Create `.env` file:

```powershell
copy .env.example .env
```

Open this file:

```text
apps/web-react/.env
```

Make sure it has:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Start React:

```powershell
npm run dev
```

React should run here:

```text
http://localhost:5173
```

Now React can connect to Laravel API.

---

## 5. Setup Flutter Mobile App

Open a new terminal.

Go to Flutter folder:

```powershell
cd apps/mobile-flutter
```

Install Flutter dependencies:

```powershell
flutter pub get
```

Check devices:

```powershell
flutter devices
```

Run an Android emulator from Android Studio or run:

```powershell
flutter emulators
flutter emulators --launch YOUR_EMULATOR_ID
```

Then run Flutter:

```powershell
flutter run
```

For Android emulator, the API URL should use:

```text
http://10.0.2.2:8000/api
```

Do not use this inside Android emulator:

```text
http://127.0.0.1:8000/api
```

Inside Android emulator, `127.0.0.1` means the emulator itself, not your computer.

---

## 6. How to Run the Full Project

You need 3 terminals.

### Terminal 1: Laravel API

```powershell
cd apps/api-laravel
php artisan serve
```

### Terminal 2: React Web

```powershell
cd apps/web-react
npm run dev
```

### Terminal 3: Flutter Mobile

```powershell
cd apps/mobile-flutter
flutter run
```

---

## 7. Test One Image on Web and Mobile

Create a public Supabase Storage bucket named:

```text
product-images
```

Open React:

```text
http://localhost:5173
```

Complete the product form, click **Choose Image**, select a JPG, PNG, or WEBP file, and click **Create Product**.

The complete flow is automatic:

```text
React file input
    → Laravel multipart API
    → Supabase Storage
    → products.image_url
    → React and Flutter
```

React displays the new image immediately. Flutter loads the same product and displays the same URL. Pull down on the Flutter Products page to refresh.

Complete instructions, including a real Android phone test, are in:

```text
docs/PRODUCT_IMAGE_UPLOAD.md
```

---

## 8. Important GitHub Rules

Do not push these files or folders:

```text
.env
node_modules/
vendor/
build/
```

Push these files:

```text
.env.example
package.json
composer.json
pubspec.yaml
```

Each team member must create their own `.env` file.

Never upload the real Supabase password to GitHub.

---

## 9. Common Problems

### Problem: React says `Failed to fetch`

Make sure Laravel is running:

```powershell
cd apps/api-laravel
php artisan serve
```

Then test:

```text
http://127.0.0.1:8000/api/products
```

---

### Problem: `products table does not exist`

Run migration:

```powershell
cd apps/api-laravel
php artisan migrate
```

Then check Supabase Table Editor.

---

### Problem: Flutter cannot connect to API

For Android emulator, use:

```text
http://10.0.2.2:8000/api
```

For a real Android phone, use your computer Wi-Fi IP:

```text
http://YOUR_COMPUTER_IP:8000/api
```

Example:

```text
http://192.168.1.10:8000/api
```

Also make sure Laravel is running with:

```powershell
php artisan serve --host=0.0.0.0 --port=8000
```

---

### Problem: React environment not working

After editing `.env`, restart React:

```powershell
Ctrl + C
npm run dev
```

Vite reads `.env` only when the dev server starts.

---

## 10. Local URLs

```text
Laravel API: http://127.0.0.1:8000
React Web: http://localhost:5173
Flutter Android Emulator API: http://10.0.2.2:8000/api
Supabase: Online PostgreSQL database
```

---

## 11. Development Flow

When adding a new feature:

```text
1. Create or update Laravel API route
2. Create or update Laravel controller/model/migration
3. Test API in browser or Postman
4. Connect React to the API
5. Connect Flutter to the API
6. Push code to GitHub
```

---

## 12. Current API Example

Products API:

```text
GET    /api/products
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
```

Create products using `multipart/form-data`:

```text
name        Keyboard
description Tri mode keyboard
price       45
stock       10
is_active   1
image       keyboard.png
```

Laravel uploads the image and returns JSON containing the generated `image_url`.

## Automatic product image upload

The React admin form now accepts a JPG, PNG, or WEBP file. Laravel validates it,
uploads it to the public Supabase `product-images` bucket, stores the generated
URL in PostgreSQL, and returns that URL to both React and Flutter.

Setup and testing: `docs/PRODUCT_IMAGE_UPLOAD.md`
