import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import Stripe from 'stripe';

import { Order, OrderStatus } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

import { Payment, PaymentStatus } from '../entities/payment.entity';

import {
  WebhookEvent,
  WebhookEventStatus,
} from '../entities/webhook-event.entity';

import {
  Entitlement,
  EntitlementStatus,
} from '../../entitlements/entities/entitlement.entity';

@Injectable()
export class PaymentsWebhookService {
  private readonly logger = new Logger(PaymentsWebhookService.name);

  constructor(private readonly dataSource: DataSource) {}

  async processEvent(event: Stripe.Event): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const insertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(WebhookEvent)
        .values({
          stripeEventId: event.id,
          eventType: event.type,
          status: WebhookEventStatus.RECEIVED,
        })
        .orIgnore()
        .returning(['id'])
        .execute();

      // PostgreSQL RETURNING returns rows only when an insert succeeds.
      // An empty result means this event was already recorded.
      if (!Array.isArray(insertResult.raw) || insertResult.raw.length === 0) {
        this.logger.warn(`Duplicate event ignored: ${event.id}`);
        return;
      }

      switch (event.type) {
        case 'payment_intent.succeeded': {
          await this.handlePaymentSucceeded(manager, event.data.object);
          break;
        }

        case 'payment_intent.payment_failed': {
          await this.handlePaymentFailed(manager, event.data.object);
          break;
        }

        case 'payment_intent.canceled': {
          await this.handlePaymentCanceled(manager, event.data.object);
          break;
        }

        default: {
          this.logger.log(`Event type not handled: ${event.type}`);
        }
      }

      await manager.update(
        WebhookEvent,
        { stripeEventId: event.id },
        {
          status: WebhookEventStatus.PROCESSED,
          processedAt: new Date(),
        },
      );

      this.logger.log(
        `Event processed successfully: ${event.type} (${event.id})`,
      );
    });
  }

  private async handlePaymentSucceeded(
    manager: EntityManager,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(
        'PaymentIntent status does not match succeeded event',
      );
    }

    const { payment, order } = await this.findAndValidatePayment(
      manager,
      paymentIntent,
    );

    if (paymentIntent.amount_received !== payment.amount) {
      throw new BadRequestException(
        'Received amount does not match expected amount',
      );
    }

    payment.status = PaymentStatus.SUCCEEDED;
    await manager.save(Payment, payment);

    if (order.status === OrderStatus.CANCELLED) {
      this.logger.error(
        `PAYMENT RECONCILIATION REQUIRED: Payment ${payment.id} succeeded for cancelled order ${order.id}.`,
      );
      return;
    }

    // Detect multiple successful payments for the same order.
    if (order.status === OrderStatus.PAID) {
      const anotherSuccessfulPayment = await manager.findOne(Payment, {
        where: {
          orderId: order.id,
          status: PaymentStatus.SUCCEEDED,
        },
      });

      if (
        anotherSuccessfulPayment &&
        anotherSuccessfulPayment.id !== payment.id
      ) {
        this.logger.error(
          `PAYMENT RECONCILIATION REQUIRED: Multiple successful payments detected for order ${order.id}. Current payment: ${payment.id}. Previous successful payment: ${anotherSuccessfulPayment.id}.`,
        );
        return;
      }
    }

    order.status = OrderStatus.PAID;
    await manager.save(Order, order);

    const orderItems = await manager.find(OrderItem, {
      where: { orderId: order.id },
    });

    if (orderItems.length === 0) {
      throw new NotFoundException(`No order items found for order ${order.id}`);
    }

    // Unique orderItemId prevents duplicate entitlements.
    await manager
      .createQueryBuilder()
      .insert()
      .into(Entitlement)
      .values(
        orderItems.map((item) => ({
          userId: order.userId,
          orderItemId: item.id,
          status: EntitlementStatus.ACTIVE,
        })),
      )
      .orIgnore()
      .execute();

    this.logger.log(`Order ${order.id} marked as PAID. Entitlements granted.`);
  }

  private async handlePaymentFailed(
    manager: EntityManager,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const { payment } = await this.findAndValidatePayment(
      manager,
      paymentIntent,
    );

    // Never downgrade a successful or cancelled payment.
    if (
      payment.status === PaymentStatus.SUCCEEDED ||
      payment.status === PaymentStatus.CANCELLED
    ) {
      this.logger.warn(
        `Ignoring failed event for payment ${payment.id} with status ${payment.status}`,
      );
      return;
    }

    payment.status = PaymentStatus.REQUIRES_PAYMENT_METHOD;
    await manager.save(Payment, payment);

    this.logger.log(`Payment ${payment.id} requires a new payment method`);
  }

  private async handlePaymentCanceled(
    manager: EntityManager,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const { payment } = await this.findAndValidatePayment(
      manager,
      paymentIntent,
    );

    // A cancellation event must not override a successful payment.
    if (payment.status === PaymentStatus.SUCCEEDED) {
      this.logger.warn(
        `Ignoring cancellation event for successful payment ${payment.id}`,
      );
      return;
    }

    payment.status = PaymentStatus.CANCELLED;
    await manager.save(Payment, payment);

    this.logger.log(`Payment ${payment.id} cancelled`);
  }

  private async findAndValidatePayment(
    manager: EntityManager,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<{ payment: Payment; order: Order }> {
    const payment = await manager.findOne(Payment, {
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment not found for PaymentIntent ${paymentIntent.id}`,
      );
    }

    const order = await manager.findOne(Order, {
      where: { id: payment.orderId },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!order) {
      throw new NotFoundException(`Order not found: ${payment.orderId}`);
    }

    if (
      paymentIntent.metadata.paymentId !== payment.id ||
      paymentIntent.metadata.orderId !== order.id
    ) {
      throw new BadRequestException('PaymentIntent metadata mismatch');
    }

    if (
      paymentIntent.amount !== payment.amount ||
      paymentIntent.currency !== payment.currency.toLowerCase()
    ) {
      throw new BadRequestException(
        'PaymentIntent amount or currency mismatch',
      );
    }

    return { payment, order };
  }
}
