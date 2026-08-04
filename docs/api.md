# TechHub API

Base URL examples:

```text
Local:      http://127.0.0.1:8000/api
Production: https://tech-hub-production-dd8a.up.railway.app/api
```

## Public routes

### List active products

```http
GET /products
```

No login required.

### Register customer

```http
POST /register
Content-Type: application/json
```

```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

The backend always stores `role: customer`.

### Shared login

```http
POST /login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "1|...",
  "user": {
    "id": 1,
    "name": "User",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

## Authenticated routes

Send:

```http
Authorization: Bearer YOUR_TOKEN
```

```text
GET  /me
POST /logout
GET  /products/{id}
```

## Admin-only routes

```text
GET    /admin/dashboard
GET    /admin/products
POST   /admin/products
PUT    /admin/products/{id}
PATCH  /admin/products/{id}
DELETE /admin/products/{id}
```

Create product uses `multipart/form-data`:

```text
name
price
stock
description
is_active
image
```
