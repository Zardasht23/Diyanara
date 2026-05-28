import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StripeService } from './stripe.service';
import { CreateCheckoutDto } from '../orders/dto/order.dto';

@Controller()
export class StripeController {
  constructor(private stripe: StripeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  checkout(@Req() req: any, @Body() dto: CreateCheckoutDto) {
    return this.stripe.createCheckoutSession(
      req.user.id,
      dto.items,
      dto.shipping,
      !!dto.saveAddress,
    );
  }

  @Post('stripe/webhook')
  @HttpCode(200)
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    try {
      const event = this.stripe.constructEvent(req.body, signature);
      await this.stripe.handleEvent(event);
      return { received: true };
    } catch (err: any) {
      throw new BadRequestException(`Webhook error: ${err.message}`);
    }
  }
}
