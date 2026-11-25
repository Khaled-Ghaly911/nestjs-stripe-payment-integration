import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

export enum EntitlementStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

@Entity('entitlements')
@Index('UQ_entitlements_order_item_id', ['orderItemId'], {
  unique: true,
})
@Index('IDX_entitlements_user_id', ['userId'])
export class Entitlement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  orderItemId!: string;

  @ManyToOne(() => OrderItem, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'orderItemId' })
  orderItem!: OrderItem;

  @Column({
    type: 'enum',
    enum: EntitlementStatus,
    default: EntitlementStatus.ACTIVE,
  })
  status!: EntitlementStatus;

  @CreateDateColumn()
  grantedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
