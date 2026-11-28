# NestJS Stripe Payment Integration

A backend payment system built with **NestJS, TypeScript, PostgreSQL, TypeORM, and Stripe**.

This project focuses on implementing a reliable payment workflow for digital products, with particular attention to payment state management, database consistency, webhook security, and transaction handling.

## Project Overview

The application allows users to purchase digital products through a backend-managed order and payment workflow.

The backend is responsible for:
- Validating product availability.
- Calculating order totals using database prices.
- Managing orders and payment records.
- Processing payment lifecycle events.
- Granting product access after successful payments.

The project is being developed incrementally, with an emphasis on clean code, maintainable architecture, and practical backend engineering principles.

## Tech Stack

| Category | Technologies |
|---|---|
| Runtime | Node.js |
| Framework | NestJS |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | TypeORM |
| Payment Provider | Stripe |
| API | REST |
| Validation | class-validator, class-transformer |

## Current Implementation Status

### Implemented

- [x] Initialize NestJS project.
- [x] Configure PostgreSQL and TypeORM.
- [x] Configure environment variables using NestJS ConfigModule.
- [x] Set up database migrations.
- [x] Design database entities and relationships.
- [x] Implement server-side order creation.
- [x] Calculate order totals using database product prices.
- [x] Validate product availability and pricing.
- [x] Prevent duplicate products within an order.
- [x] Store product name and price snapshots in order items.
- [x] Use database transactions when creating orders.
- [x] Implement order retrieval by ID.
- [x] Implement retrieval of the current user's orders.
- [x] Validate request payloads using DTOs.
- [x] Test order creation and validation scenarios using Postman.

### Planned

- [ ] Integrate Stripe PaymentIntents.
- [ ] Persist Stripe PaymentIntent records.
- [ ] Implement webhook signature verification.
- [ ] Handle duplicate webhook events.
- [ ] Handle successful and failed payments.
- [ ] Support multiple payment attempts.
- [ ] Implement entitlement management.
- [ ] Implement refund processing.
- [ ] Add authentication and authorization.
- [ ] Add automated unit and integration tests.
- [ ] Improve logging and error handling.
- [ ] Add API documentation.

## Database Design

The database is designed around the following entities:

| Entity | Responsibility |
|---|---|
| User | Stores customer information. |
| Product | Stores digital products and their prices. |
| Order | Represents a customer's purchase. |
| OrderItem | Stores purchased products and price snapshots. |
| Payment | Tracks payment attempts and Stripe PaymentIntent references. |
| Refund | Tracks refund operations. |
| WebhookEvent | Stores received Stripe webhook events for deduplication. |
| Entitlement | Represents a user's access to purchased products. |

### Important Design Decisions

- Monetary values are stored as integers in the smallest currency unit (cents).
- Product prices are calculated and validated on the backend.
- Order items preserve product name and price snapshots.
- Orders and their items are created within a single database transaction.
- Financial records are designed to preserve historical consistency.
- Payment attempts are tracked independently from order status.
- Entitlements are granted only after successful payment confirmation.

## Current API Endpoints

All endpoints currently use a temporary development user ID. JWT authentication and authenticated user extraction will be implemented later.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Create a new order. |
| GET | `/orders` | Retrieve the current user's orders. |
| GET | `/orders/:id` | Retrieve a specific order belonging to the current user. |

### Create Order Example

**POST** `/orders`

Request:

```json
{
  "items": [
    {
      "productId": "PRODUCT_UUID",
      "quantity": 2
    }
  ]
}
```

The backend retrieves active products, validates their prices, calculates line totals, and creates the order.

Example response:

```json
{
  "id": "ORDER_UUID",
  "userId": "USER_UUID",
  "totalAmount": 7598,
  "currency": "usd",
  "status": "PENDING_PAYMENT",
  "items": [
    {
      "productId": "PRODUCT_UUID",
      "productName": "Advanced NestJS Architecture",
      "unitAmount": 3799,
      "quantity": 2,
      "lineTotal": 7598
    }
  ]
}
```

All monetary amounts are represented in cents.

## Project Setup

### Prerequisites

- Node.js
- PostgreSQL
- npm

### Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
cd stripe-payment-api
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=stripe_payment_db
```

Stripe configuration will be added when PaymentIntent integration is implemented.

Never commit real credentials or secret API keys.

### Database Migrations

Run the existing migrations:

```bash
npm run migration:run
```

Generate a new migration after entity changes:

```bash
npm run migration:generate -- src/database/migrations/MigrationName
```

### Start the Application

```bash
npm run start:dev
```

The application runs on the configured NestJS port (3000 by default).

## Engineering Topics

The project explores practical backend engineering concepts, including:

- PaymentIntent lifecycle and payment state transitions.
- Server-side price calculation.
- Database transactions and ACID properties.
- Idempotency and duplicate event handling.
- Webhook signature verification.
- Payment retries and multiple payment attempts.
- Financial data consistency.
- Refund lifecycle management.
- Entitlement management.
- Reconciliation between Stripe and the local database.

## Testing

Current order endpoints and validation scenarios have been tested manually using Postman.

Covered scenarios include:

- Successful order creation.
- Inactive products.
- Nonexistent products.
- Invalid quantities.
- Duplicate products.
- Empty order items.
- Retrieving existing orders.
- Handling nonexistent orders.

Automated tests and payment lifecycle tests are planned for later stages.

## Project Status

**Current stage: Order Management completed and tested.**

The next development milestone is Stripe PaymentIntent integration, followed by webhook processing and the complete payment lifecycle.

---

Built as a practical backend engineering project to explore reliable payment processing with NestJS and Stripe.