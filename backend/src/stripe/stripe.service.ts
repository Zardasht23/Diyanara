import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { CartItemDto, ShippingAddressDto } from '../orders/dto/order.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null;

  constructor(private orders: OrdersService) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith('sk_test_xxx')) {
      this.logger.warn(
        'STRIPE_SECRET_KEY not configured – checkout will run in mock mode.',
      );
      this.stripe = null;
    } else {
      this.stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    }
  }

  async createCheckoutSession(
    userId: string,
    items: CartItemDto[],
    shipping: ShippingAddressDto,
    saveAddress = false,
  ) {
    const { order, products, shippingCostCents } =
      await this.orders.createDraftOrder(userId, items, shipping, saveAddress);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Mock mode: pretend payment succeeded so the UX is testable end-to-end
    // without real Stripe keys.
    if (!this.stripe) {
      const mockSessionId = `mock_${order.id}`;
      await this.orders.attachStripeSession(order.id, mockSessionId);
      await this.orders.markPaidBySessionId(mockSessionId);
      return {
        url: `${frontend}/account?paid=1&order=${order.id}`,
        mock: true,
      };
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        return {
          quantity: item.quantity,
          price_data: {
            currency: product.currency,
            unit_amount: item.unitPriceCents,
            product_data: {
              name: item.productName,
              images: product.imageUrl ? [product.imageUrl] : undefined,
            },
          },
        };
      });

    if (shippingCostCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: order.currency,
          unit_amount: shippingCostCents,
          product_data: {
            name: 'PostNord shipping',
          },
        },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${frontend}/account?paid=1&order=${order.id}`,
      cancel_url: `${frontend}/cart?cancelled=1`,
      metadata: { orderId: order.id, userId },
      customer_email: undefined,
    });

    await this.orders.attachStripeSession(order.id, session.id);
    return { url: session.url, sessionId: session.id };
  }

  constructEvent(rawBody: Buffer, signature: string) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not set');
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  async handleEvent(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.orders.markPaidBySessionId(
        session.id,
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : undefined,
      );
    }
  }
}
