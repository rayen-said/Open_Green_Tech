import { ConfigService } from '@nestjs/config';
import { AiCropAdvisorResponseDto } from './dto/ai-crop-advisor-response.dto';
export type AiTelemetryInput = {
    temperature: number;
    humidity: number;
    light: number;
    anomaly: boolean;
};
export type AiUserProfileContext = {
    soilType?: string | null;
    crops: string[];
    habits: Record<string, unknown>;
    locationText?: string | null;
    farmSizeHa?: number | null;
};
export type AiAnalyzeInput = {
    telemetry: AiTelemetryInput;
    anomalyScore: number;
    reliabilityScore: number;
    profile: AiUserProfileContext | null;
    seasonHint: string;
};
export declare class AiService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    private seasonFromMonth;
    buildPrompt(input: AiAnalyzeInput): string;
    analyzeStructured(input: AiAnalyzeInput): Promise<AiCropAdvisorResponseDto | null>;
}
