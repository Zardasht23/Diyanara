import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/user.dto';

const PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  postalCode: true,
  country: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        ...PROFILE_SELECT,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  me(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: PROFILE_SELECT,
    });
  }

  updateMe(id: string, dto: UpdateMeDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: PROFILE_SELECT,
    });
  }
}
