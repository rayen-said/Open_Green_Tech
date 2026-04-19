import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PublishCommandDto {
  @IsOptional()
  @IsIn(['AUTO', 'MANUAL'])
  mode?: 'AUTO' | 'MANUAL';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  temp_low?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  temp_high?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  hum_low?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  lux_low?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  moist_low?: number;

  @IsOptional()
  @IsBoolean()
  heater?: boolean;

  @IsOptional()
  @IsBoolean()
  fan?: boolean;

  @IsOptional()
  @IsBoolean()
  pump?: boolean;

  @IsOptional()
  @IsBoolean()
  humid?: boolean;

  @IsOptional()
  @IsBoolean()
  light?: boolean;

  @IsOptional()
  @IsString()
  correlationId?: string;
}
