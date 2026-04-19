import { IsString } from 'class-validator';

export class GenerateRecommendationsDto {
  @IsString()
  deviceId!: string;
}
