import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AiUserProfileContext } from '../ai/ai.service';
import type { UpsertUserProfileDto } from './dto/upsert-user-profile.dto';

@Injectable()
export class UserProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getResponseJson(userId: string) {
    const row = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!row) {
      return {
        soilType: null as string | null,
        crops: [] as string[],
        location: null as { lat: number; lng: number } | null,
        farmSizeHa: null as number | null,
        habits: {} as Record<string, unknown>,
        completedOnboarding: false,
      };
    }
    const crops = Array.isArray(row.crops)
      ? (row.crops as unknown[]).map((c) => String(c))
      : [];
    const habits =
      row.habits && typeof row.habits === 'object' && !Array.isArray(row.habits)
        ? (row.habits as Record<string, unknown>)
        : {};
    const location =
      row.lat != null && row.lng != null
        ? { lat: row.lat, lng: row.lng }
        : null;
    return {
      soilType: row.soilType,
      crops,
      location,
      farmSizeHa: row.farmSizeHa,
      habits,
      completedOnboarding: row.completedOnboarding,
    };
  }

  async upsert(userId: string, dto: UpsertUserProfileDto) {
    const crops = dto.crops ?? [];
    const habits = dto.habits
      ? {
          ...(dto.habits.wateringFrequency != null
            ? { wateringFrequency: dto.habits.wateringFrequency }
            : {}),
          ...(dto.habits.fertilizerUsage != null
            ? { fertilizerUsage: dto.habits.fertilizerUsage }
            : {}),
          ...(dto.habits.careMode != null
            ? { careMode: dto.habits.careMode }
            : {}),
        }
      : undefined;

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        soilType: dto.soilType ?? null,
        crops,
        farmSizeHa: dto.farmSizeHa ?? null,
        lat: dto.location?.lat ?? null,
        lng: dto.location?.lng ?? null,
        habits: habits ?? {},
        completedOnboarding: dto.completedOnboarding ?? false,
      },
      update: {
        ...(dto.soilType !== undefined ? { soilType: dto.soilType } : {}),
        ...(dto.crops !== undefined ? { crops: dto.crops } : {}),
        ...(dto.farmSizeHa !== undefined ? { farmSizeHa: dto.farmSizeHa } : {}),
        ...(dto.location !== undefined
          ? { lat: dto.location.lat, lng: dto.location.lng }
          : {}),
        ...(habits !== undefined ? { habits } : {}),
        ...(dto.completedOnboarding !== undefined
          ? { completedOnboarding: dto.completedOnboarding }
          : {}),
      },
    });

    return this.getResponseJson(userId);
  }

  async toAiContext(userId: string): Promise<AiUserProfileContext | null> {
    const row = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!row) {
      return null;
    }
    const crops = Array.isArray(row.crops)
      ? (row.crops as unknown[]).map((c) => String(c))
      : [];
    const habits =
      row.habits && typeof row.habits === 'object' && !Array.isArray(row.habits)
        ? (row.habits as Record<string, unknown>)
        : {};
    const locationText =
      row.lat != null && row.lng != null
        ? `${row.lat.toFixed(4)}, ${row.lng.toFixed(4)}`
        : null;
    return {
      soilType: row.soilType,
      crops,
      habits,
      locationText,
      farmSizeHa: row.farmSizeHa,
    };
  }
}
