import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { TelemetryGateway } from './telemetry.gateway';
export declare class TelemetryService {
    private readonly prisma;
    private readonly gateway;
    constructor(prisma: PrismaService, gateway: TelemetryGateway);
    create(deviceId: string, userId: string, role: Role, dto: CreateTelemetryDto): Promise<{
        id: string;
        deviceId: string;
        temperature: number;
        humidity: number;
        light: number;
        anomaly: boolean;
        timestamp: Date;
    }>;
    list(deviceId: string, userId: string, role: Role): Promise<{
        id: string;
        deviceId: string;
        temperature: number;
        humidity: number;
        light: number;
        anomaly: boolean;
        timestamp: Date;
    }[]>;
    latest(userId: string, role: Role): Promise<{
        latest: {
            id: string;
            deviceId: string;
            temperature: number;
            humidity: number;
            light: number;
            anomaly: boolean;
            timestamp: Date;
        } | null;
        id: string;
        name: string;
    }[]>;
}
