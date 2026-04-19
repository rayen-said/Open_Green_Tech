import { IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class CreateTelemetryDto {
  @IsNumber()
  @Min(-20)
  @Max(80)
  temperature!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  humidity!: number;

  @IsNumber()
  @Min(0)
  @Max(100000)
  light!: number;

  @IsBoolean()
  anomaly!: boolean;
}
