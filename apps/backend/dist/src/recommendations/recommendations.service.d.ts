import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class RecommendationsService {
    private readonly prisma;
    private readonly configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    private buildRules;
    private generateWithLLM;
    generate(deviceId: string, userId: string, role: Role): Promise<[{
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        reason: string;
        detectedIssues: string[];
        confidence: number;
    }, {
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        reason: string;
        detectedIssues: string[];
        confidence: number;
    }, {
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        reason: string;
        detectedIssues: string[];
        confidence: number;
    }, {
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        reason: string;
        detectedIssues: string[];
        confidence: number;
    }]>;
    list(deviceId: string, userId: string, role: Role): Promise<{
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        reason: string;
        detectedIssues: string[];
        confidence: number;
    }[]>;
}
