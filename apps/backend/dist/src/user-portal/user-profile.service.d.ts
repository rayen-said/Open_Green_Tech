import { PrismaService } from '../prisma/prisma.service';
import type { AiUserProfileContext } from '../ai/ai.service';
import type { UpsertUserProfileDto } from './dto/upsert-user-profile.dto';
export declare class UserProfileService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getResponseJson(userId: string): Promise<{
        soilType: string | null;
        crops: string[];
        location: {
            lat: number;
            lng: number;
        } | null;
        farmSizeHa: number | null;
        habits: Record<string, unknown>;
        completedOnboarding: boolean;
    }>;
    upsert(userId: string, dto: UpsertUserProfileDto): Promise<{
        soilType: string | null;
        crops: string[];
        location: {
            lat: number;
            lng: number;
        } | null;
        farmSizeHa: number | null;
        habits: Record<string, unknown>;
        completedOnboarding: boolean;
    }>;
    toAiContext(userId: string): Promise<AiUserProfileContext | null>;
}
