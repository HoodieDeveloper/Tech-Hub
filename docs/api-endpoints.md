# Tech Hub API Endpoints

Base URL for local development:

```text
http://127.0.0.1:8000/api
```

## Auth

```text
POST /register
POST /login
POST /logout
GET  /me
```

## Products

```text
GET    /products
GET    /products/{id}
POST   /products
PUT    /products/{id}
DELETE /products/{id}
```

## Categories

```text
GET    /categories
POST   /categories
PUT    /categories/{id}
DELETE /categories/{id}
```

## Cart

```text
GET    /cart
POST   /cart
PUT    /cart/{id}
DELETE /cart/{id}
```

## Orders

```text
GET  /orders
POST /orders
GET  /orders/{id}
PUT  /orders/{id}/status
```

Order statuses:

```text
pending
confirmed
preparing
leaving_shop
arriving_soon
completed
cancelled
```

## Reviews

```text
GET  /products/{product}/reviews
POST /products/{product}/reviews
```

## Reports

```text
GET /reports/sales
GET /reports/best-selling-products
GET /reports/monthly-revenue
```
