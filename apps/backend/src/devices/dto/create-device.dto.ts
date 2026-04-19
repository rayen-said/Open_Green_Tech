import { IsEnum, IsString, MinLength } from 'class-validator';
import { DeviceStatus } from '@prisma/client';

export class CreateDeviceDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  location!: string;

  @IsString()
  soilType!: string;

  @IsString()
  cropType!: string;

  @IsEnum(DeviceStatus)
  status!: DeviceStatus;
}
