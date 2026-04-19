import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { SyncGamificationDto } from './dto/upsert-user-profile.dto';

const LEVEL_BEGINNER = 'BEGINNER';
const LEVEL_INTERMEDIATE = 'INTERMEDIATE';
const LEVEL_EXPERT = 'EXPERT';

function levelFromXp(xp: number): string {
  if (xp >= 300) {
    return LEVEL_EXPERT;
  }
  if (xp >= 100) {
    return LEVEL_INTERMEDIATE;
  }
  return LEVEL_BEGINNER;
}

function defaultTasksState() {
  return {
    version: 1,
    tasks: [
      {
        id: 'water_today',
        title: 'Water your plants today',
        xpReward: 15,
        completed: false,
      },
      {
        id: 'check_system_health',
        title: 'Check system health',
        xpReward: 10,
        completed: false,
      },
    ],
  };
}

@Injectable()
export class UserGamificationService {
  constructor(private readonly prisma: PrismaService) {}

  private mergeTasksState(
    existing: unknown,
    incoming?: Record<string, unknown>,
  ): Record<string, unknown> {
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : defaultTasksState();
    if (!incoming) {
      return base;
    }
    return { ...base, ...incoming };
  }

  async getOrCreate(userId: string) {
    let row = await this.prisma.userGamification.findUnique({
      where: { userId },
    });
    if (!row) {
      row = await this.prisma.userGamification.create({
        data: {
          userId,
          xp: 0,
          level: LEVEL_BEGINNER,
          tasksState: defaultTasksState(),
        },
      });
    }
    return {
      xp: row.xp,
      level: row.level,
      lastDailyCheckIn: row.lastDailyCheckIn?.toISOString() ?? null,
      tasksState: row.tasksState,
    };
  }

  async sync(userId: string, dto: SyncGamificationDto) {
    const current = await this.getOrCreate(userId);
    let xp = current.xp;
    let lastDaily = current.lastDailyCheckIn
      ? new Date(current.lastDailyCheckIn)
      : null;

    if (dto.event === 'daily_login') {
      const now = new Date();
      const sameDay =
        lastDaily &&
        lastDaily.getUTCFullYear() === now.getUTCFullYear() &&
        lastDaily.getUTCMonth() === now.getUTCMonth() &&
        lastDaily.getUTCDate() === now.getUTCDate();
      if (!sameDay) {
        xp += 10;
        lastDaily = now;
      }
    } else if (dto.event === 'follow_recommendation') {
      xp += 20;
    } else if (dto.event === 'water_on_time') {
      xp += 25;
    } else if (dto.event === 'check_system_health') {
      xp += 10;
    }

    if (dto.xpDelta != null && Number.isFinite(dto.xpDelta)) {
      xp += Math.round(dto.xpDelta);
    }
    if (xp < 0) {
      xp = 0;
    }

    const level = levelFromXp(xp);
    const tasksState = dto.tasksState
      ? this.mergeTasksState(current.tasksState, dto.tasksState)
      : (current.tasksState as Record<string, unknown>);

    const tasksJson = tasksState as Prisma.InputJsonValue;

    await this.prisma.userGamification.upsert({
      where: { userId },
      create: {
        userId,
        xp,
        level,
        lastDailyCheckIn: lastDaily,
        tasksState: tasksJson,
      },
      update: {
        xp,
        level,
        lastDailyCheckIn: lastDaily,
        tasksState: tasksJson,
      },
    });

    return this.getOrCreate(userId);
  }
}
