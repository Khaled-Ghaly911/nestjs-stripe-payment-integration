import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity';
import { Refund } from './refund.entity';

export enum PaymentStatus {
  REQUIRES_PAYMENT_METHOD = 'REQUIRES_PAYMENT_METHOD',
  REQUIRES_CONFIRMATION = 'REQUIRES_CONFIRMATION',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  PROCESSING = 'PROCESSING',
  REQUIRES_CAPTURE = 'REQUIRES_CAPTURE',
  SUCCEEDED = 'SUCCEEDED',
  CANCELLED = 'CANCELLED',
}

@Entity('payments')
@Index('IDX_payments_order_id', ['orderId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.payments, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
  })
  stripePaymentIntentId!: string | null;

  @Column({ type: 'integer' })
  amount!: number;

  @Column({ type: 'integer', default: 0 })
  amountRefunded!: number;

  @Column({ type: 'varchar', length: 3 })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.REQUIRES_PAYMENT_METHOD,
  })
  status!: PaymentStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Refund, (refund) => refund.payment)
  refunds!: Refund[];
}
