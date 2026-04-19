import type { RequestUser } from '../common/types/request-user.type';
import { SyncGamificationDto, UpsertUserProfileDto } from './dto/upsert-user-profile.dto';
import { UserGamificationService } from './user-gamification.service';
import { UserProfileService } from './user-profile.service';
export declare class UserPortalController {
    private readonly profile;
    private readonly gamification;
    constructor(profile: UserProfileService, gamification: UserGamificationService);
    getProfile(req: {
        user: RequestUser;
    }): Promise<{
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
    upsertProfile(req: {
        user: RequestUser;
    }, dto: UpsertUserProfileDto): Promise<{
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
    getGamification(req: {
        user: RequestUser;
    }): Promise<{
        xp: number;
        level: string;
        lastDailyCheckIn: string | null;
        tasksState: import("@prisma/client/runtime/client").JsonValue;
    }>;
    syncGamification(req: {
        user: RequestUser;
    }, dto: SyncGamificationDto): Promise<{
        xp: number;
        level: string;
        lastDailyCheckIn: string | null;
        tasksState: import("@prisma/client/runtime/client").JsonValue;
    }>;
}
