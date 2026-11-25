import 'dotenv/config';
import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Refund } from '../payments/entities/refund.entity';
import { WebhookEvent } from '../payments/entities/webhook-event.entity';
import { Entitlement } from '../entitlements/entities/entitlement.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [
    User,
    Product,
    Order,
    OrderItem,
    Payment,
    Refund,
    WebhookEvent,
    Entitlement,
  ],

  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
