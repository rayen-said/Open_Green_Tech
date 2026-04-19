import { Role } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfileService } from '../user-portal/user-profile.service';
export declare class RecommendationsService {
    private readonly prisma;
    private readonly aiService;
    private readonly userProfileService;
    constructor(prisma: PrismaService, aiService: AiService, userProfileService: UserProfileService);
    private buildRules;
    private scoreFromSeries;
    private mapAiToLegacyPayload;
    generate(deviceId: string, userId: string, role: Role): Promise<[{
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        confidence: number;
        reason: string;
        detectedIssues: import("@prisma/client/runtime/client").JsonValue;
    }, {
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        confidence: number;
        reason: string;
        detectedIssues: import("@prisma/client/runtime/client").JsonValue;
    }, {
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        confidence: number;
        reason: string;
        detectedIssues: import("@prisma/client/runtime/client").JsonValue;
    }, {
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        confidence: number;
        reason: string;
        detectedIssues: import("@prisma/client/runtime/client").JsonValue;
    }]>;
    list(deviceId: string, userId: string, role: Role): Promise<{
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        confidence: number;
        reason: string;
        detectedIssues: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
}
