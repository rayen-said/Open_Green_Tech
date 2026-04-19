import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ProfileLocationDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

export class ProfileHabitsDto {
  @IsOptional()
  @IsString()
  wateringFrequency?: string;

  @IsOptional()
  @IsString()
  fertilizerUsage?: string;

  @IsOptional()
  @IsString()
  careMode?: string;
}

export class UpsertUserProfileDto {
  @IsOptional()
  @IsString()
  soilType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  crops?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileLocationDto)
  location?: ProfileLocationDto;

  @IsOptional()
  @IsNumber()
  farmSizeHa?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileHabitsDto)
  habits?: ProfileHabitsDto;

  @IsOptional()
  @IsBoolean()
  completedOnboarding?: boolean;
}

export class SyncGamificationDto {
  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @IsNumber()
  xpDelta?: number;

  @IsOptional()
  @IsObject()
  tasksState?: Record<string, unknown>;
}
