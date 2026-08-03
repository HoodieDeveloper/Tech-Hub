# Tech Hub Flutter App

The mobile app reads products from the same Laravel API used by the React web app. Product pictures are loaded from the `image_url` returned by Laravel.

## Android emulator

```powershell
flutter pub get
flutter run
```

The default API URL is:

```text
http://10.0.2.2:8000/api
```

## Physical Android phone

Run Laravel so other devices on your Wi-Fi can reach it:

```powershell
cd ..\api-laravel
php artisan serve --host=0.0.0.0 --port=8000
```

Find your computer IPv4 address:

```powershell
ipconfig
```

Then run Flutter with that address:

```powershell
cd ..\mobile-flutter
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8000/api
```

Replace `192.168.1.10` with your actual computer IPv4 address.

The Android app includes Internet permission. Local cleartext HTTP is enabled for development testing; use an HTTPS Laravel URL for production.

See the complete test guide:

```text
docs/PRODUCT_IMAGE_TEST.md
```
