import { RequestUser } from '../common/types/request-user.type';
import { GenerateRecommendationsDto } from './dto/generate-recommendations.dto';
import { RecommendationsService } from './recommendations.service';
export declare class RecommendationsController {
    private readonly recommendationsService;
    constructor(recommendationsService: RecommendationsService);
    generate(req: {
        user: RequestUser;
    }, dto: GenerateRecommendationsDto): Promise<[{
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        reason: string;
        detectedIssues: import("@prisma/client/runtime/client").JsonValue;
        confidence: number;
    }, {
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        reason: string;
        detectedIssues: import("@prisma/client/runtime/client").JsonValue;
        confidence: number;
    }, {
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        reason: string;
        detectedIssues: import("@prisma/client/runtime/client").JsonValue;
        confidence: number;
    }, {
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        reason: string;
        detectedIssues: import("@prisma/client/runtime/client").JsonValue;
        confidence: number;
    }]>;
    list(req: {
        user: RequestUser;
    }, deviceId: string): Promise<{
        id: string;
        createdAt: Date;
        deviceId: string;
        title: string;
        type: import("@prisma/client").$Enums.RecommendationType;
        explanation: string;
        reason: string;
        detectedIssues: import("@prisma/client/runtime/client").JsonValue;
        confidence: number;
    }[]>;
}
