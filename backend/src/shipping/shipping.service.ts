import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { getLabelsDir, ensureDataDirs } from '../config/paths';

export interface ShippingLabel {
  trackingNumber: string;
  labelUrl: string;
  carrier: 'postnord';
}

/**
 * Free shipping threshold in DKK ore (1 DKK = 100 ore).
 * 250 DKK = 25000 ore.
 */
const FREE_SHIPPING_THRESHOLD_CENTS = 25000;

/** Flat shipping cost in DKK ore: 60 DKK = 6000 ore. */
const FLAT_SHIPPING_CENTS = 6000;

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private readonly labelsDir = getLabelsDir();
  private readonly apiKey = process.env.POSTNORD_API_KEY || '';
  private readonly mockMode =
    !this.apiKey || this.apiKey.startsWith('postnord_xxx');

  constructor(private prisma: PrismaService) {
    ensureDataDirs().catch(() => undefined);
    if (this.mockMode) {
      this.logger.warn(
        'POSTNORD_API_KEY not configured – labels will be generated in mock mode.',
      );
    }
  }

  /** Calculates shipping cost in DKK ore based on subtotal in DKK ore. */
  calculateShippingCents(subtotalCents: number, country = 'DK'): number {
    if (country !== 'DK') {
      // For now we only ship in DK; this can be extended later.
      return FLAT_SHIPPING_CENTS;
    }
    return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : FLAT_SHIPPING_CENTS;
  }

  /**
   * Creates a shipping label for the given order. In production this calls
   * PostNord's Shipping API. Without an API key, we fall back to a deterministic
   * mock label PDF written to disk so the rest of the flow is testable.
   */
  async createLabelForOrder(orderId: string): Promise<ShippingLabel | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });
    if (!order) {
      this.logger.error(`createLabelForOrder: order ${orderId} not found`);
      return null;
    }
    if (!order.shippingAddress1 || !order.shippingCity || !order.shippingZip) {
      this.logger.error(
        `createLabelForOrder: order ${orderId} has no shipping address`,
      );
      return null;
    }
    if (order.trackingNumber && order.labelUrl) {
      // Idempotent — already labeled.
      return {
        trackingNumber: order.trackingNumber,
        labelUrl: order.labelUrl,
        carrier: 'postnord',
      };
    }

    const totalWeight = order.items.reduce(
      (sum, i) => sum + (i.weightGrams || 50) * i.quantity,
      0,
    );

    let label: ShippingLabel;
    if (this.mockMode) {
      label = await this.createMockLabel(order, totalWeight);
    } else {
      label = await this.createPostNordLabel(order, totalWeight);
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber: label.trackingNumber,
        labelUrl: label.labelUrl,
        carrier: label.carrier,
      },
    });
    return label;
  }

  private async createMockLabel(
    order: any,
    weightGrams: number,
  ): Promise<ShippingLabel> {
    const tracking = `MOCK${crypto
      .randomBytes(6)
      .toString('hex')
      .toUpperCase()}DK`;
    const fileName = `${order.id}.pdf`;
    const filePath = path.join(this.labelsDir, fileName);
    const pdf = this.buildMockPdf({
      tracking,
      orderId: order.id,
      sender: this.senderInfo(),
      receiver: {
        name: order.shippingName || order.user.email,
        address1: order.shippingAddress1,
        address2: order.shippingAddress2 || '',
        zip: order.shippingZip,
        city: order.shippingCity,
        country: order.shippingCountry || 'DK',
        phone: order.shippingPhone || '',
      },
      weightGrams,
    });
    await fs.writeFile(filePath, pdf);
    this.logger.log(`Mock label created: ${fileName} (tracking ${tracking})`);
    return {
      trackingNumber: tracking,
      labelUrl: `/labels/${fileName}`,
      carrier: 'postnord',
    };
  }

  /**
   * PostNord Booking API (Shipment v5). Requires a PostNord Business contract
   * and an x-api-key. The shape below matches the documented endpoint.
   *
   * Docs: https://portal.postnord.com/se/en/resources/integrations/api/booking-api/
   */
  private async createPostNordLabel(
    order: any,
    weightGrams: number,
  ): Promise<ShippingLabel> {
    const endpoint =
      process.env.POSTNORD_API_URL ||
      'https://api2.postnord.com/rest/shipment/v5/shipment';
    const sender = this.senderInfo();
    const body = {
      shipmentServiceCode: process.env.POSTNORD_SERVICE_CODE || '17', // MyPack Home DK
      sender: {
        name: sender.name,
        address1: sender.address1,
        city: sender.city,
        postCode: sender.zip,
        countryCode: sender.country,
        email: sender.email,
        smsNo: sender.phone,
      },
      receiver: {
        name: order.shippingName || order.user.email,
        address1: order.shippingAddress1,
        address2: order.shippingAddress2 || undefined,
        city: order.shippingCity,
        postCode: order.shippingZip,
        countryCode: order.shippingCountry || 'DK',
        email: order.user.email,
        smsNo: order.shippingPhone || undefined,
      },
      reference: `DY-${order.id.slice(-8).toUpperCase()}`,
      parcels: [{ weight: Math.max(50, weightGrams), valuePerParcel: true }],
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`PostNord error ${res.status}: ${text}`);
      throw new Error(`PostNord label creation failed: ${res.status}`);
    }
    const data: any = await res.json();
    const shipment = data?.CompositeShipmentData?.[0] || data;
    const tracking =
      shipment?.parcels?.[0]?.parcelNumber ||
      shipment?.shipmentId ||
      `PN${Date.now()}`;
    const pdfBase64 = shipment?.pdfs?.[0]?.pdf || shipment?.documents?.[0]?.pdf;
    if (!pdfBase64) {
      throw new Error('PostNord response missing label PDF');
    }
    const fileName = `${order.id}.pdf`;
    await fs.writeFile(
      path.join(this.labelsDir, fileName),
      Buffer.from(pdfBase64, 'base64'),
    );
    this.logger.log(`PostNord label created: ${tracking}`);
    return {
      trackingNumber: tracking,
      labelUrl: `/labels/${fileName}`,
      carrier: 'postnord',
    };
  }

  private senderInfo() {
    return {
      name: process.env.SENDER_NAME || 'Diyanara',
      address1: process.env.SENDER_ADDRESS || 'Storegade 1',
      zip: process.env.SENDER_ZIP || '1000',
      city: process.env.SENDER_CITY || 'København',
      country: process.env.SENDER_COUNTRY || 'DK',
      email: process.env.SENDER_EMAIL || 'shop@diyanara.test',
      phone: process.env.SENDER_PHONE || '+4500000000',
    };
  }

  /**
   * Builds a minimal valid 1-page PDF showing the shipping info — used in mock
   * mode so you can still print "labels" from your label printer when testing.
   */
  private buildMockPdf(args: {
    tracking: string;
    orderId: string;
    sender: ReturnType<ShippingService['senderInfo']>;
    receiver: {
      name: string;
      address1: string;
      address2: string;
      zip: string;
      city: string;
      country: string;
      phone: string;
    };
    weightGrams: number;
  }): Buffer {
    const esc = (s: string) =>
      s
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');

    const lines = [
      'PostNord (MOCK)',
      `Tracking: ${args.tracking}`,
      `Order: DY-${args.orderId.slice(-8).toUpperCase()}`,
      'TO',
      args.receiver.name,
      args.receiver.address1,
      args.receiver.address2,
      `${args.receiver.zip} ${args.receiver.city}`,
      args.receiver.country,
      args.receiver.phone ? `Tel: ${args.receiver.phone}` : '',
      '',
      'FROM',
      args.sender.name,
      args.sender.address1,
      `${args.sender.zip} ${args.sender.city}`,
      args.sender.country,
      '',
      `Weight: ${args.weightGrams}g`,
    ].filter(Boolean);

    let y = 740;
    let text = 'BT\n/F1 14 Tf\n';
    for (const ln of lines) {
      text += `1 0 0 1 60 ${y} Tm (${esc(ln)}) Tj\n`;
      y -= 22;
    }
    text += 'ET';

    const stream = text;
    const objects: string[] = [];
    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objects.push(
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    );
    objects.push(
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
    objects.push(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    );

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];
    objects.forEach((obj, i) => {
      offsets.push(Buffer.byteLength(pdf, 'binary'));
      pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'binary');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      pdf += off.toString().padStart(10, '0') + ' 00000 n \n';
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'binary');
  }
}
