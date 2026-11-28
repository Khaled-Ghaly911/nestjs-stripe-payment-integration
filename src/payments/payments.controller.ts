import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { PaymentsService } from './payments.service';

@Controller('orders/:orderId/payment-intent')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  createPaymentIntent(@Param('orderId', new ParseUUIDPipe()) orderId: string) {
    // Temporary development user until authentication is implemented.
    const userId = 'f1782fa6-f85a-4ae1-8287-f760edf0b42e';

    return this.paymentsService.createPaymentIntent(orderId, userId);
  }
}
