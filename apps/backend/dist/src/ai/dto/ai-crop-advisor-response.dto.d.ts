export declare class AiCropAdvisorResponseDto {
    health: string;
    irrigation: string;
    fertilizer: string;
    crops: string[];
    warnings: string[];
}
export declare function isAiCropAdvisorResponse(value: unknown): value is AiCropAdvisorResponseDto;
