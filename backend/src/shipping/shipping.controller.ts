import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { promises as fs } from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ShippingService } from './shipping.service';
import { getLabelsDir } from '../config/paths';

@Controller()
export class ShippingController {
  constructor(
    private prisma: PrismaService,
    private shipping: ShippingService,
  ) {}

  /**
   * Streams a label PDF. Admins can fetch any label; customers can only fetch
   * labels for their own orders.
   */
  @UseGuards(JwtAuthGuard)
  @Get('labels/:file')
  async getLabel(
    @Param('file') file: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const safe = path.basename(file);
    if (!safe.endsWith('.pdf')) {
      throw new NotFoundException();
    }
    const orderId = safe.replace(/\.pdf$/, '');
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException();
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
      throw new ForbiddenException();
    }
    const filePath = path.join(getLabelsDir(), safe);
    try {
      const buf = await fs.readFile(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safe}"`);
      res.send(buf);
    } catch {
      throw new NotFoundException('Label not generated yet');
    }
  }

  /** Admin: manually (re)generate a label for an order. */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('orders/:id/label')
  async regenerate(@Param('id') id: string) {
    const label = await this.shipping.createLabelForOrder(id);
    if (!label) throw new NotFoundException('Could not create label');
    return label;
  }
}
