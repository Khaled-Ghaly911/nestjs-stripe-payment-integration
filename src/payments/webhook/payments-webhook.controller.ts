import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { PaymentsService } from '../payments.service';
import { PaymentsWebhookService } from '../services/payments-webhook.service';

@Controller('payments')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentsWebhookService: PaymentsWebhookService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    this.logger.log('Received Stripe webhook request');

    if (!request.rawBody) {
      this.logger.error('Missing raw request body');
      throw new BadRequestException('Missing raw request body');
    }

    if (!signature) {
      this.logger.error('Missing Stripe signature');
      throw new BadRequestException('Missing Stripe signature');
    }

    const event = this.paymentsService.verifyWebhookSignature(
      request.rawBody,
      signature,
    );

    this.logger.log(
      `Signature verified. Event: ${event.type}, ID: ${event.id}`,
    );

    await this.paymentsWebhookService.processEvent(event);

    return {
      received: true,
      type: event.type,
    };
  }
}
