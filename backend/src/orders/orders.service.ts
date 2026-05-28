import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartItemDto, ShippingAddressDto } from './dto/order.dto';
import { OrderStatus } from '@prisma/client';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private shipping: ShippingService,
  ) {}

  async createDraftOrder(
    userId: string,
    items: CartItemDto[],
    shipping: ShippingAddressDto,
    saveAddress = false,
  ) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, active: true },
    });
    if (products.length !== items.length) {
      throw new BadRequestException('One or more products are unavailable');
    }
    const lineItems = items.map((i) => {
      const product = products.find((p) => p.id === i.productId)!;
      if (product.stock < i.quantity) {
        throw new BadRequestException(`${product.name} is out of stock`);
      }
      return {
        productId: product.id,
        productName: product.name,
        unitPriceCents: product.priceCents,
        quantity: i.quantity,
        weightGrams: product.weightGrams,
      };
    });
    const subtotalCents = lineItems.reduce(
      (sum, li) => sum + li.unitPriceCents * li.quantity,
      0,
    );
    const country = shipping.country || 'DK';
    const shippingCostCents = this.shipping.calculateShippingCents(
      subtotalCents,
      country,
    );
    const totalCents = subtotalCents + shippingCostCents;

    const order = await this.prisma.order.create({
      data: {
        userId,
        subtotalCents,
        shippingCostCents,
        totalCents,
        status: OrderStatus.PENDING,
        shippingName: shipping.name,
        shippingPhone: shipping.phone,
        shippingAddress1: shipping.address1,
        shippingAddress2: shipping.address2,
        shippingCity: shipping.city,
        shippingZip: shipping.postalCode,
        shippingCountry: country,
        items: { create: lineItems },
      },
      include: { items: true },
    });

    if (saveAddress) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: shipping.name,
          phone: shipping.phone,
          addressLine1: shipping.address1,
          addressLine2: shipping.address2,
          city: shipping.city,
          postalCode: shipping.postalCode,
          country,
        },
      });
    }

    return { order, products, subtotalCents, shippingCostCents, totalCents };
  }

  listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAll() {
    return this.prisma.order.findMany({
      include: {
        items: true,
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  async markPaidBySessionId(sessionId: string, intentId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
      include: { items: true },
    });
    if (!order || order.status !== OrderStatus.PENDING) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, stripeIntentId: intentId },
      });
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    });

    // Fire-and-forget label creation; failure should not break checkout.
    this.shipping.createLabelForOrder(order.id).catch((e) => {
      this.logger.error(`Label creation failed for ${order.id}: ${e.message}`);
    });
  }

  attachStripeSession(orderId: string, sessionId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { stripeSessionId: sessionId },
    });
  }
}
