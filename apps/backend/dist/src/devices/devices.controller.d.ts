import { RequestUser } from '../common/types/request-user.type';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DevicesService } from './devices.service';
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    create(req: {
        user: RequestUser;
    }, dto: CreateDeviceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        location: string;
        soilType: string;
        cropType: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        ownerId: string;
    }>;
    findAll(req: {
        user: RequestUser;
    }): import("@prisma/client").Prisma.PrismaPromise<({
        owner: {
            id: string;
            fullName: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        location: string;
        soilType: string;
        cropType: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        ownerId: string;
    })[]>;
    findOne(req: {
        user: RequestUser;
    }, id: string): Promise<{
        owner: {
            id: string;
            fullName: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        location: string;
        soilType: string;
        cropType: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        ownerId: string;
    }>;
    update(req: {
        user: RequestUser;
    }, id: string, dto: UpdateDeviceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        location: string;
        soilType: string;
        cropType: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        ownerId: string;
    }>;
    remove(req: {
        user: RequestUser;
    }, id: string): Promise<{
        success: boolean;
    }>;
}
