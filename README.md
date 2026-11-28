# NestJS Stripe Payment Integration

A backend payment system built with **NestJS, TypeScript, PostgreSQL, TypeORM, and Stripe**.

This project focuses on implementing a reliable payment workflow for digital products, with particular attention to payment state management, database consistency, webhook security, idempotency, and transaction handling.

## Project Overview

The application allows users to purchase digital products through a backend-managed order and payment workflow.

The backend is responsible for:

- Validating product availability.
- Calculating order totals using database prices.
- Managing orders and payment records.
- Creating and managing Stripe PaymentIntents.
- Processing asynchronous payment lifecycle events through webhooks.
- Handling failed payments and payment retries.
- Granting product access only after successful payment confirmation.

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
| Payment Integration | Stripe PaymentIntents, Stripe Webhooks |
| Testing Tools | Postman, Stripe CLI |

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
- [x] Integrate Stripe PaymentIntents.
- [x] Persist local payment records and Stripe PaymentIntent references.
- [x] Implement PaymentIntent idempotency keys.
- [x] Implement webhook signature verification.
- [x] Handle duplicate webhook events using Stripe event IDs.
- [x] Process successful, failed, and canceled payment events.
- [x] Support payment retries using the same PaymentIntent.
- [x] Update order status after successful payment confirmation.
- [x] Grant entitlements after successful payment.
- [x] Protect payment state transitions against duplicate and out-of-order events.
- [x] Use database transactions for webhook event processing.
- [x] Test order creation and validation scenarios using Postman.
- [x] Test payment lifecycle scenarios using Stripe Test Mode and Stripe CLI.

### Planned

- [ ] Implement refund processing (partial and full refunds).
- [ ] Add authentication and authorization.
- [ ] Replace the temporary development user ID with authenticated user extraction.
- [ ] Add automated unit and integration tests.
- [ ] Improve logging and error handling.
- [ ] Add API documentation.
- [ ] Improve payment creation concurrency handling.
- [ ] Implement payment reconciliation for exceptional cases.

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
| WebhookEvent | Stores received Stripe webhook events for deduplication and processing status. |
| Entitlement | Represents a user's access to purchased products. |

### Important Design Decisions

- Monetary values are stored as integers in the smallest currency unit (cents).
- Product prices are calculated and validated on the backend. Client-supplied prices are never trusted.
- Order items preserve product name and price snapshots.
- Orders and their items are created within a single database transaction.
- Financial records are designed to preserve historical consistency.
- Payment attempts are tracked independently from order status.
- Each local payment record represents a payment attempt associated with a Stripe PaymentIntent.
- Stripe webhook events are deduplicated using their unique event IDs.
- Webhook processing and local database updates are performed within a database transaction.
- Payment state transitions are protected against duplicate processing and state regression.
- Entitlements are granted only after successful payment confirmation from Stripe.
- Unique constraints help prevent duplicate webhook records and duplicate entitlements.

## Payment Workflow

The payment workflow follows a backend-controlled architecture:

1. **Order Creation**
   - The client submits product IDs and quantities.
   - The backend retrieves product prices from the database.
   - The backend validates products and calculates the total amount.
   - A pending order and its items are persisted.

2. **Payment Initialization**
   - The backend validates order ownership and payment eligibility.
   - A local payment record is created.
   - The backend creates a Stripe PaymentIntent using an idempotency key.
   - The PaymentIntent reference and initial status are stored locally.
   - The client receives the PaymentIntent client secret.

3. **Payment Processing**
   - A client-side payment interface is expected to collect and confirm payment details.
   - Stripe processes the payment and maintains the PaymentIntent state.
   - The client-side result is not treated as authoritative proof of payment.

4. **Webhook Processing**
   - Stripe sends asynchronous payment events to the backend.
   - The backend verifies the webhook signature.
   - Duplicate events are ignored using the Stripe event ID.
   - Payment and order records are updated within a database transaction.
   - Entitlements are granted only after a verified successful payment event.

5. **Payment Retry**
   - A failed payment attempt can leave the PaymentIntent in `requires_payment_method`.
   - The customer can retry using another payment method on the same PaymentIntent.
   - A successful retry triggers the normal successful payment webhook workflow.

### Payment Lifecycle Events

| Stripe Event | Backend Behavior |
|---|---|
| `payment_intent.succeeded` | Marks the payment as successful, updates the order, and grants entitlements. |
| `payment_intent.payment_failed` | Updates the payment to require a new payment method. |
| `payment_intent.canceled` | Marks the payment as canceled. |

## Current API Endpoints

All endpoints currently use a temporary development user ID. JWT authentication and authenticated user extraction will be implemented later.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Create a new order. |
| GET | `/orders` | Retrieve the current user's orders. |
| GET | `/orders/:id` | Retrieve a specific order belonging to the current user. |
| POST | `/orders/:orderId/payment-intent` | Create or retrieve the payment intent for an order. |
| POST | `/payments/webhook` | Receive and process Stripe webhook events. |

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

### Create PaymentIntent Example

**POST** `/orders/:orderId/payment-intent`

The backend validates the order, creates a local payment record, and initializes a Stripe PaymentIntent.

Example response:

```json
{
  "paymentId": "PAYMENT_UUID",
  "orderId": "ORDER_UUID",
  "amount": 7598,
  "currency": "usd",
  "status": "REQUIRES_PAYMENT_METHOD",
  "clientSecret": "PAYMENT_INTENT_CLIENT_SECRET"
}
```

The client secret is intended for the client-side payment flow. Stripe secret API keys must remain on the backend and must never be exposed to clients or committed to source control.

## Project Setup

### Prerequisites

- Node.js
- PostgreSQL
- npm
- Stripe account in test mode
- Stripe CLI

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

STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Use your own Stripe test credentials.

Never commit real credentials, webhook secrets, client secrets, or secret API keys.

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

### Stripe Webhook Forwarding

For local development, use Stripe CLI to forward webhook events to the NestJS application:

```bash
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled --forward-to localhost:3000/payments/webhook
```

Copy the generated webhook signing secret into `STRIPE_WEBHOOK_SECRET` in your `.env` file.

Keep the Stripe CLI listener running while testing webhook events.

## Testing

The project has been tested manually using Postman, Stripe Test Mode, and Stripe CLI.

### Order Management Tests

- Successful order creation.
- Inactive products.
- Nonexistent products.
- Invalid quantities.
- Duplicate products.
- Empty order items.
- Retrieving existing orders.
- Handling nonexistent orders.

### Payment Lifecycle Tests

- Successful PaymentIntent creation.
- Stripe webhook signature verification.
- Successful payment processing.
- Failed card payment processing.
- Payment retry using the same PaymentIntent.
- Transition from `REQUIRES_PAYMENT_METHOD` to `SUCCEEDED`.
- Order status update from `PENDING_PAYMENT` to `PAID`.
- Entitlement creation after successful payment.
- Duplicate webhook event delivery and deduplication.
- Verification that failed payments do not grant entitlements.

All payment scenarios are tested in Stripe Test Mode. No real card payments are processed.

## Engineering Topics

The project explores practical backend engineering concepts, including:

- PaymentIntent lifecycle and payment state transitions.
- Server-side price calculation.
- Database transactions and ACID properties.
- Idempotency keys.
- Webhook signature verification.
- Duplicate webhook event handling.
- Payment retries and multiple payment attempts.
- Financial data consistency.
- Refund lifecycle management.
- Entitlement management.
- Reconciliation between Stripe and the local database.
- Handling asynchronous external events.

## Project Status

**Current stage: Core Order and Payment Lifecycle implemented and manually tested.**

The next development milestone is refund processing, followed by authentication, automated testing, and further reliability improvements.

---

Built as a practical backend engineering project to explore reliable payment processing with NestJS and Stripe.