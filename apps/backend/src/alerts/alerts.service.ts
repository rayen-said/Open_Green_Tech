import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, role: Role) {
    return this.prisma.alert.findMany({
      where: role === Role.ADMIN ? {} : { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });
  }

  async acknowledge(alertId: string, userId: string, role: Role) {
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (role !== Role.ADMIN && alert.userId !== userId) {
      throw new ForbiddenException('You cannot acknowledge this alert');
    }

    return this.prisma.alert.update({
      where: { id: alertId },
      data: { acknowledged: true },
    });
  }
}
