import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';

import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderPricingService } from './services/order-pricing.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly orderPricingService: OrderPricingService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const productIds = [...new Set(dto.items.map((item) => item.productId))];

      const products = await manager.getRepository(Product).find({
        where: {
          id: In(productIds),
          isActive: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products are unavailable');
      }

      const pricing = this.orderPricingService.calculate(dto.items, products);

      const orderRepository = manager.getRepository(Order);
      const orderItemRepository = manager.getRepository(OrderItem);

      const order = orderRepository.create({
        userId: user.id,
        totalAmount: pricing.totalAmount,
        currency: pricing.currency,
        status: OrderStatus.PENDING_PAYMENT,
      });

      const savedOrder = await orderRepository.save(order);

      const orderItems = pricing.items.map((item) =>
        orderItemRepository.create({
          ...item,
          orderId: savedOrder.id,
        }),
      );

      const savedItems = await orderItemRepository.save(orderItems);

      return {
        ...savedOrder,
        items: savedItems,
      };
    });
  }

  async getMyOrders(userId: string) {
    return this.dataSource.getRepository(Order).find({
      where: { userId },
      relations: {
        items: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.dataSource.getRepository(Order).findOne({
      where: {
        id: orderId,
        userId,
      },
      relations: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
