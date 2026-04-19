import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateDeviceDto) {
    return this.prisma.device.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  findAll(userId: string, role: Role) {
    return this.prisma.device.findMany({
      where: role === Role.ADMIN ? {} : { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (role !== Role.ADMIN && device.ownerId !== userId) {
      throw new ForbiddenException('You cannot access this device');
    }

    return device;
  }

  async update(id: string, userId: string, role: Role, dto: UpdateDeviceDto) {
    await this.findOne(id, userId, role);

    return this.prisma.device.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string, role: Role) {
    await this.findOne(id, userId, role);
    await this.prisma.device.delete({ where: { id } });
    return { success: true };
  }
}
