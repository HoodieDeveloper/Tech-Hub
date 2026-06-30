# Supabase migrations

For this project, use Laravel migrations as the main way to create database tables.

Laravel migration folder:

```text
apps/api-laravel/database/migrations/
```

When you run:

```powershell
php artisan migrate
```

Laravel will create the tables inside Supabase PostgreSQL.
