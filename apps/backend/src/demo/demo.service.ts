import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryService } from '../telemetry/telemetry.service';

@Injectable()
export class DemoService {
  private timer: NodeJS.Timeout | null = null;
  private tick = 0;
  private startedAt: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly telemetryService: TelemetryService,
  ) {}

  async start(options?: { resetData?: boolean; intervalMs?: number }) {
    if (options?.resetData) {
      await this.prisma.alert.deleteMany();
      await this.prisma.recommendation.deleteMany();
      await this.prisma.telemetry.deleteMany();
    }

    const devices = await this.prisma.device.findMany({
      orderBy: { createdAt: 'asc' },
      take: 3,
    });

    if (devices.length === 0) {
      throw new NotFoundException('No devices available. Seed data first.');
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.tick = 0;
    this.startedAt = new Date().toISOString();
    const intervalMs = Math.max(1000, options?.intervalMs ?? 2000);

    this.timer = setInterval(() => {
      void Promise.all(
        devices.map((device, index) => {
          const anomaly = this.tick % (6 + index) === 0;
          return this.telemetryService.create(
            device.id,
            'demo-system',
            Role.ADMIN,
            {
              temperature: anomaly
                ? 43 + (this.tick % 3)
                : 22 + index * 3 + (this.tick % 4),
              humidity: anomaly
                ? 20 + (this.tick % 4)
                : 46 + ((this.tick + index) % 19),
              light: 260 + this.tick * 8 + index * 30,
              anomaly,
            },
          );
        }),
      )
        .catch(() => {
          return;
        })
        .finally(() => {
          this.tick += 1;
        });
    }, intervalMs);

    return {
      running: true,
      startedAt: this.startedAt,
      intervalMs,
      devices: devices.map((device) => ({ id: device.id, name: device.name })),
    };
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    return {
      running: false,
      startedAt: this.startedAt,
      ticksSent: this.tick,
    };
  }

  status() {
    return {
      running: Boolean(this.timer),
      startedAt: this.startedAt,
      ticksSent: this.tick,
    };
  }
}
