# NestJS Stripe Payment Integration

A backend payment integration project built with NestJS, TypeScript, PostgreSQL, TypeORM, and Stripe.

## Project Goal

The goal of this project is to build a reliable payment system while understanding the engineering concepts behind payment processing, webhook handling, and transaction consistency.

## Tech Stack

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Stripe API

## Implementation Roadmap

- [x] Initialize NestJS project
- [ ] Configure PostgreSQL and TypeORM
- [ ] Design Order and Payment entities
- [ ] Integrate Stripe SDK
- [ ] Create PaymentIntents
- [ ] Implement webhook signature verification
- [ ] Handle duplicate webhook events
- [ ] Implement database transactions
- [ ] Handle multiple payment attempts
- [ ] Implement payment reconciliation
- [ ] Handle refunds
- [ ] Test payment scenarios

## Engineering Topics

This project explores:

- PaymentIntent lifecycle
- Secret API keys and client secrets
- Webhook security and event delivery
- Idempotency
- Database transactions and ACID properties
- Event deduplication
- Payment state management
- Reconciliation between Stripe and the local database

## Learning Notes

Each implementation stage will include the technical decisions, challenges, and lessons learned.

## Status

Currently in the initial project setup stage.