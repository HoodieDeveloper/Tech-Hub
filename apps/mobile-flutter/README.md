# TechHub Mobile

The mobile app shows the public product catalog before login.

```text
Open app → view products → tap product → login → product details
```

Run with the Railway API:

```powershell
flutter pub get
flutter run --dart-define=API_BASE_URL=https://tech-hub-production-dd8a.up.railway.app/api
```

The Railway URL is also the default in `lib/core/api/api_client.dart`.

Admin accounts are recognized, but management stays in the React web admin dashboard. The Flutter app is customer-focused.
