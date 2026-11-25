import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

import { OrdersService } from './orders.service';
import { OrderPricingService } from './services/order-pricing.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Product, Order, OrderItem])],
  providers: [OrdersService, OrderPricingService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
