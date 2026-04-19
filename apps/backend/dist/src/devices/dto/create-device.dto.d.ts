import { DeviceStatus } from '@prisma/client';
export declare class CreateDeviceDto {
    name: string;
    location: string;
    soilType: string;
    cropType: string;
    status: DeviceStatus;
}
