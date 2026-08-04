# TechHub Authentication, Roles, and Access

## User experience

```text
Guest
├── Can open the web or mobile app
├── Can view the public product list
└── Clicks a product → redirected to the shared login page

Customer
├── Uses the same login form as an admin
├── After login → opens the selected product details
└── Future protected features: cart, checkout, orders, reviews

Admin
├── Uses the same login form as a customer
├── Laravel reads role = admin
└── After login → opens the web admin dashboard
```

## Where the role is stored

TechHub uses Laravel Sanctum for login tokens. The `users` table is stored in Supabase PostgreSQL and contains:

```text
users.role = customer
users.role = admin
```

No separate Supabase Auth role configuration is required for this version because React and Flutter do not connect directly to Supabase Auth. They call Laravel, and Laravel checks the role.

Supabase Storage is also accessed only through Laravel. The Supabase service-role key stays in Laravel/Railway and must never be placed in React or Flutter.

## API access rules

```text
Public
GET  /api/products
POST /api/register
POST /api/login

Authenticated customer or admin
GET  /api/me
POST /api/logout
GET  /api/products/{id}

Admin only
GET    /api/admin/dashboard
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/{id}
PATCH  /api/admin/products/{id}
DELETE /api/admin/products/{id}
```

## First production setup

After this code is merged into `main`, Railway must apply the migrations:

```bash
php artisan migrate --force
```

Recommended Railway Pre-Deploy Command:

```bash
php artisan migrate --force
```

Then create or promote the first admin from a trusted terminal connected to the production database:

```bash
php artisan techhub:create-admin admin@example.com --name="TechHub Admin"
```

The command asks for the password without saving it in source code.

## Customer accounts

Public registration always creates:

```text
role = customer
```

The client cannot register itself as an admin. Only the trusted Artisan admin command or a direct administrator-controlled database change can create an admin.
