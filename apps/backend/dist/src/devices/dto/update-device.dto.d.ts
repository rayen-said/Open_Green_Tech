import { DeviceStatus } from '@prisma/client';
export declare class UpdateDeviceDto {
    name?: string;
    location?: string;
    soilType?: string;
    cropType?: string;
    status?: DeviceStatus;
}
