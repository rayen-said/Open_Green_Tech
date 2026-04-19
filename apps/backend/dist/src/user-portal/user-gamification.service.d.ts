import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { SyncGamificationDto } from './dto/upsert-user-profile.dto';
export declare class UserGamificationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mergeTasksState;
    getOrCreate(userId: string): Promise<{
        xp: number;
        level: string;
        lastDailyCheckIn: string | null;
        tasksState: Prisma.JsonValue;
    }>;
    sync(userId: string, dto: SyncGamificationDto): Promise<{
        xp: number;
        level: string;
        lastDailyCheckIn: string | null;
        tasksState: Prisma.JsonValue;
    }>;
}
