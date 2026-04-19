export declare class ProfileLocationDto {
    lat: number;
    lng: number;
}
export declare class ProfileHabitsDto {
    wateringFrequency?: string;
    fertilizerUsage?: string;
    careMode?: string;
}
export declare class UpsertUserProfileDto {
    soilType?: string;
    crops?: string[];
    location?: ProfileLocationDto;
    farmSizeHa?: number;
    habits?: ProfileHabitsDto;
    completedOnboarding?: boolean;
}
export declare class SyncGamificationDto {
    event?: string;
    xpDelta?: number;
    tasksState?: Record<string, unknown>;
}
