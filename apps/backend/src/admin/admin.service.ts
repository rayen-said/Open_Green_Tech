import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [
      totalUsers,
      totalDevices,
      anomaliesDetected,
      liveTelemetry24h,
      alertsOpen,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.device.count(),
      this.prisma.telemetry.count({ where: { anomaly: true } }),
      this.prisma.telemetry.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.alert.count({ where: { acknowledged: false } }),
    ]);

    const recentActivity = await this.prisma.telemetry.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        device: {
          select: { id: true, name: true, location: true },
        },
      },
    });

    const topProblemGroups = await this.prisma.telemetry.groupBy({
      by: ['deviceId'],
      where: { anomaly: true },
      _count: {
        deviceId: true,
      },
      orderBy: {
        _count: {
          deviceId: 'desc',
        },
      },
      take: 5,
    });

    const topProblemDevices = await Promise.all(
      topProblemGroups.map(async (entry) => {
        const device = await this.prisma.device.findUnique({
          where: { id: entry.deviceId },
          select: { id: true, name: true, location: true },
        });
        return {
          deviceId: entry.deviceId,
          deviceName: device?.name ?? 'Unknown device',
          location: device?.location ?? '-',
          anomalies: entry._count.deviceId,
        };
      }),
    );

    return {
      totalUsers,
      totalDevices,
      anomaliesDetected,
      liveTelemetry24h,
      alertsOpen,
      kpiSeries: [
        { label: 'Devices', value: totalDevices },
        { label: 'Anomalies', value: anomaliesDetected },
      ],
      topProblemDevices,
      recentActivity,
    };
  }
}
