import { BadRequestException, Injectable } from '@nestjs/common';

import { Product } from '../../products/entities/product.entity';
import { CreateOrderItemDto } from '../dto/create-order-item.dto';

export interface PricedOrderItem {
  productId: string;
  productName: string;
  unitAmount: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderPricingResult {
  currency: string;
  totalAmount: number;
  items: PricedOrderItem[];
}

@Injectable()
export class OrderPricingService {
  calculate(
    requestedItems: CreateOrderItemDto[],
    products: Product[],
  ): OrderPricingResult {
    this.validateUniqueProducts(requestedItems);

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    const currency = this.validateCurrency(products);

    const items = requestedItems.map((requestedItem) => {
      this.validateQuantity(requestedItem.quantity);

      const product = productsById.get(requestedItem.productId);

      if (!product) {
        throw new BadRequestException('Invalid product');
      }

      this.validateProductPrice(product);

      const lineTotal = product.price * requestedItem.quantity;

      if (!Number.isSafeInteger(lineTotal)) {
        throw new BadRequestException('Order amount is too large');
      }

      return {
        productId: product.id,
        productName: product.name,
        unitAmount: product.price,
        quantity: requestedItem.quantity,
        lineTotal,
      };
    });

    const totalAmount = items.reduce((total, item) => {
      const result = total + item.lineTotal;

      if (!Number.isSafeInteger(result)) {
        throw new BadRequestException('Order amount is too large');
      }

      return result;
    }, 0);

    return {
      currency,
      totalAmount,
      items,
    };
  }

  private validateUniqueProducts(items: CreateOrderItemDto[]): void {
    const productIds = items.map((item) => item.productId);

    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException('Duplicate products are not allowed');
    }
  }

  private validateQuantity(quantity: number): void {
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new BadRequestException('Invalid product quantity');
    }
  }

  private validateCurrency(products: Product[]): string {
    if (products.length === 0) {
      throw new BadRequestException('Order must contain products');
    }

    const currency = products[0].currency.toLowerCase();

    if (currency !== 'usd') {
      throw new BadRequestException('Only USD payments are supported');
    }

    const hasDifferentCurrency = products.some(
      (product) => product.currency.toLowerCase() !== currency,
    );

    if (hasDifferentCurrency) {
      throw new BadRequestException('All products must have the same currency');
    }

    return currency;
  }

  private validateProductPrice(product: Product): void {
    if (!Number.isSafeInteger(product.price) || product.price <= 0) {
      throw new BadRequestException(`Invalid price for product ${product.id}`);
    }
  }
}
