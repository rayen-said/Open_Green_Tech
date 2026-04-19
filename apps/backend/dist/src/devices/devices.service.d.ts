import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
export declare class DevicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(ownerId: string, dto: CreateDeviceDto): Promise<{
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
    findAll(userId: string, role: Role): import("@prisma/client").Prisma.PrismaPromise<({
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
    findOne(id: string, userId: string, role: Role): Promise<{
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
    update(id: string, userId: string, role: Role, dto: UpdateDeviceDto): Promise<{
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
    remove(id: string, userId: string, role: Role): Promise<{
        success: boolean;
    }>;
}
