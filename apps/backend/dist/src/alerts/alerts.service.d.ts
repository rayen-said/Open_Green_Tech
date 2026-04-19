import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class AlertsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(userId: string, role: Role): import("@prisma/client").Prisma.PrismaPromise<({
        device: {
            id: string;
            name: string;
            location: string;
        };
    } & {
        id: string;
        createdAt: Date;
        deviceId: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
        title: string;
        message: string;
        acknowledged: boolean;
        userId: string | null;
    })[]>;
    acknowledge(alertId: string, userId: string, role: Role): Promise<{
        id: string;
        createdAt: Date;
        deviceId: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
        title: string;
        message: string;
        acknowledged: boolean;
        userId: string | null;
    }>;
}
