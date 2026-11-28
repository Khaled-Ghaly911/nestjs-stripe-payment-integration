import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

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

  @Get()
  getMyOrders() {
    const userId = 'f1782fa6-f85a-4ae1-8287-f760edf0b42e';

    return this.ordersService.getMyOrders(userId);
  }

  @Get(':id')
  getOrderById(@Param('id', new ParseUUIDPipe()) orderId: string) {
    const userId = 'f1782fa6-f85a-4ae1-8287-f760edf0b42e';

    return this.ordersService.getOrderById(userId, orderId);
  }
}
