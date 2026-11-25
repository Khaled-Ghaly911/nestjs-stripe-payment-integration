import { Body, Controller, Post } from '@nestjs/common';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    const userId = 'f1782fa6-f85a-4ae1-8287-f760edf0b42e';

    return this.ordersService.createOrder(userId, createOrderDto);
  }
}
