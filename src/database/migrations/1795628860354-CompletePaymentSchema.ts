import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompletePaymentSchema1795628860354 implements MigrationInterface {
  name = 'CompletePaymentSchema1795628860354';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP CONSTRAINT IF EXISTS "FK_af929a5f2a400fdb6913b4967e1"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."refunds_status_enum"
      AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED')
    `);

    await queryRunner.query(`
      CREATE TABLE "refunds" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "paymentId" uuid NOT NULL,
        "stripeRefundId" varchar(255),
        "amount" integer NOT NULL,
        "status" "public"."refunds_status_enum"
          NOT NULL DEFAULT 'PENDING',
        "reason" varchar(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_74f40269fd9a90cdd60d61ef575"
          UNIQUE ("stripeRefundId"),
        CONSTRAINT "PK_5106efb01eeda7e49a78b869738"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refunds_payment_id"
      ON "refunds" ("paymentId")
    `);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(150) NOT NULL,
        "description" text,
        "price" integer NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'usd',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "productName" varchar(255) NOT NULL,
        "unitAmount" integer NOT NULL,
        "quantity" integer NOT NULL,
        "lineTotal" integer NOT NULL,
        CONSTRAINT "PK_005269d8574e6fac0493715c308"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_order_id"
      ON "order_items" ("orderId")
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"
          UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."webhook_events_status_enum"
      AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED')
    `);

    await queryRunner.query(`
      CREATE TABLE "webhook_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "stripeEventId" varchar(255) NOT NULL,
        "eventType" varchar(100) NOT NULL,
        "status" "public"."webhook_events_status_enum"
          NOT NULL DEFAULT 'RECEIVED',
        "processedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4cba37e6a0acb5e1fc49c34ebfd"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_webhook_events_stripe_event_id"
      ON "webhook_events" ("stripeEventId")
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."entitlements_status_enum"
      AS ENUM ('ACTIVE', 'REVOKED')
    `);

    await queryRunner.query(`
      CREATE TABLE "entitlements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "orderItemId" uuid NOT NULL,
        "status" "public"."entitlements_status_enum"
          NOT NULL DEFAULT 'ACTIVE',
        "grantedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "revokedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_6a45cb6f5747d49365a879bffde"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_entitlements_user_id"
      ON "entitlements" ("userId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_entitlements_order_item_id"
      ON "entitlements" ("orderItemId")
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD "amountRefunded" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "stripePaymentIntentId"
      TYPE varchar(255)
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."payments_status_enum"
      RENAME TO "payments_status_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."payments_status_enum"
      AS ENUM (
        'REQUIRES_PAYMENT_METHOD',
        'REQUIRES_CONFIRMATION',
        'REQUIRES_ACTION',
        'PROCESSING',
        'REQUIRES_CAPTURE',
        'SUCCEEDED',
        'CANCELLED'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "status" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "status"
      TYPE "public"."payments_status_enum"
      USING (
        CASE "status"::text
          WHEN 'PENDING' THEN 'REQUIRES_PAYMENT_METHOD'
          WHEN 'FAILED' THEN 'REQUIRES_PAYMENT_METHOD'
          WHEN 'SUCCEEDED' THEN 'SUCCEEDED'
          WHEN 'CANCELLED' THEN 'CANCELLED'
        END
      )::"public"."payments_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "status"
      SET DEFAULT 'REQUIRES_PAYMENT_METHOD'
    `);

    await queryRunner.query(`
      DROP TYPE "public"."payments_status_enum_old"
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD "userId" uuid NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payments_order_id"
      ON "payments" ("orderId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_user_id"
      ON "orders" ("userId")
    `);

    await queryRunner.query(`
      ALTER TABLE "refunds"
      ADD CONSTRAINT "FK_a276dea330e561499e4a6e1b309"
      FOREIGN KEY ("paymentId")
      REFERENCES "payments"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_af929a5f2a400fdb6913b4967e1"
      FOREIGN KEY ("orderId")
      REFERENCES "orders"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"
      FOREIGN KEY ("orderId")
      REFERENCES "orders"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD CONSTRAINT "FK_cdb99c05982d5191ac8465ac010"
      FOREIGN KEY ("productId")
      REFERENCES "products"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"
      FOREIGN KEY ("userId")
      REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "entitlements"
      ADD CONSTRAINT "FK_ce5285303a2e4073b2b745bb1e3"
      FOREIGN KEY ("userId")
      REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "entitlements"
      ADD CONSTRAINT "FK_a0f48aa11a7d33777cf55d30bfe"
      FOREIGN KEY ("orderItemId")
      REFERENCES "order_items"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "entitlements"
      DROP CONSTRAINT "FK_a0f48aa11a7d33777cf55d30bfe"
    `);

    await queryRunner.query(`
      ALTER TABLE "entitlements"
      DROP CONSTRAINT "FK_ce5285303a2e4073b2b745bb1e3"
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items"
      DROP CONSTRAINT "FK_cdb99c05982d5191ac8465ac010"
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items"
      DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP CONSTRAINT "FK_af929a5f2a400fdb6913b4967e1"
    `);

    await queryRunner.query(`
      ALTER TABLE "refunds"
      DROP CONSTRAINT "FK_a276dea330e561499e4a6e1b309"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_orders_user_id"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_payments_order_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN "userId"
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."payments_status_enum"
      RENAME TO "payments_status_enum_new"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."payments_status_enum"
      AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED')
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "status" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "status"
      TYPE "public"."payments_status_enum"
      USING (
        CASE "status"::text
          WHEN 'REQUIRES_PAYMENT_METHOD' THEN 'PENDING'
          WHEN 'REQUIRES_CONFIRMATION' THEN 'PENDING'
          WHEN 'REQUIRES_ACTION' THEN 'PENDING'
          WHEN 'PROCESSING' THEN 'PENDING'
          WHEN 'REQUIRES_CAPTURE' THEN 'PENDING'
          WHEN 'SUCCEEDED' THEN 'SUCCEEDED'
          WHEN 'CANCELLED' THEN 'CANCELLED'
        END
      )::"public"."payments_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "status"
      SET DEFAULT 'PENDING'
    `);

    await queryRunner.query(`
      DROP TYPE "public"."payments_status_enum_new"
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN "amountRefunded"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."UQ_entitlements_order_item_id"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_entitlements_user_id"
    `);

    await queryRunner.query(`
      DROP TABLE "entitlements"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."entitlements_status_enum"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."UQ_webhook_events_stripe_event_id"
    `);

    await queryRunner.query(`
      DROP TABLE "webhook_events"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."webhook_events_status_enum"
    `);

    await queryRunner.query(`
      DROP TABLE "users"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_order_items_order_id"
    `);

    await queryRunner.query(`
      DROP TABLE "order_items"
    `);

    await queryRunner.query(`
      DROP TABLE "products"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_refunds_payment_id"
    `);

    await queryRunner.query(`
      DROP TABLE "refunds"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."refunds_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_af929a5f2a400fdb6913b4967e1"
      FOREIGN KEY ("orderId")
      REFERENCES "orders"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }
}
