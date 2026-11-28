import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from '../orders/entities/order.entity';

import { Payment } from './entities/payment.entity';
import { Refund } from './entities/refund.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Entitlement } from '../entitlements/entities/entitlement.entity';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsWebhookController } from './webhook/payments-webhook.controller';
import { PaymentsWebhookService } from './services/payments-webhook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Payment,
      Refund,
      WebhookEvent,
      Entitlement,
    ]),
  ],
  providers: [PaymentsService, PaymentsWebhookService],
  controllers: [PaymentsController, PaymentsWebhookController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
