import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@Req() req: any) {
    return this.orders.listForUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  listAll() {
    return this.orders.listAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.orders.getById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(id, dto.status as any);
  }
}
