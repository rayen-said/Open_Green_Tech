import { IsArray, IsString } from 'class-validator';

/**
 * Strict JSON contract returned by the crop-advisor LLM prompt.
 */
export class AiCropAdvisorResponseDto {
  @IsString()
  health!: string;

  @IsString()
  irrigation!: string;

  @IsString()
  fertilizer!: string;

  @IsArray()
  @IsString({ each: true })
  crops!: string[];

  @IsArray()
  @IsString({ each: true })
  warnings!: string[];
}

export function isAiCropAdvisorResponse(
  value: unknown,
): value is AiCropAdvisorResponseDto {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.health === 'string' &&
    typeof o.irrigation === 'string' &&
    typeof o.fertilizer === 'string' &&
    Array.isArray(o.crops) &&
    o.crops.every((c) => typeof c === 'string') &&
    Array.isArray(o.warnings) &&
    o.warnings.every((w) => typeof w === 'string')
  );
}
