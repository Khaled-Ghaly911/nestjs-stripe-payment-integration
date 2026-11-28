import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
      {
        maxNetworkRetries: 2,
      },
    );
  }

  async createPaymentIntent(orderId: string, userId: string) {
    const order = await this.ordersRepository.findOne({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('This order cannot be paid');
    }

    let payment = await this.paymentsRepository.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });

    // Reuse an existing PaymentIntent when possible.
    if (payment?.stripePaymentIntentId) {
      const existingIntent = await this.stripe.paymentIntents.retrieve(
        payment.stripePaymentIntentId,
      );

      if (existingIntent.status !== 'canceled') {
        return this.buildPaymentResponse(payment, existingIntent);
      }

      payment = null;
    }

    // Create a local payment attempt before calling Stripe.
    if (!payment) {
      payment = this.paymentsRepository.create({
        orderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        amountRefunded: 0,
        status: PaymentStatus.REQUIRES_PAYMENT_METHOD,
      });

      payment = await this.paymentsRepository.save(payment);
    }

    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: payment.amount,
        currency: payment.currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: order.id,
          paymentId: payment.id,
        },
      },
      {
        idempotencyKey: payment.id,
      },
    );

    payment.status = this.mapStripeStatus(paymentIntent.status);
    payment.stripePaymentIntentId = paymentIntent.id;

    await this.paymentsRepository.save(payment);

    return this.buildPaymentResponse(payment, paymentIntent);
  }

  private mapStripeStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    switch (status) {
      case 'requires_payment_method':
        return PaymentStatus.REQUIRES_PAYMENT_METHOD;

      case 'requires_confirmation':
        return PaymentStatus.REQUIRES_CONFIRMATION;

      case 'requires_action':
        return PaymentStatus.REQUIRES_ACTION;

      case 'processing':
        return PaymentStatus.PROCESSING;

      case 'requires_capture':
        return PaymentStatus.REQUIRES_CAPTURE;

      case 'succeeded':
        return PaymentStatus.SUCCEEDED;

      case 'canceled':
        return PaymentStatus.CANCELLED;

      default:
        throw new InternalServerErrorException(
          `Unsupported Stripe PaymentIntent status: ${status}`,
        );
    }
  }

  private buildPaymentResponse(
    payment: Payment,
    paymentIntent: Stripe.PaymentIntent,
  ) {
    if (!paymentIntent.client_secret) {
      throw new InternalServerErrorException(
        'PaymentIntent client secret is unavailable',
      );
    }

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      clientSecret: paymentIntent.client_secret,
    };
  }

  verifyWebhookSignature(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }
  }
}
