import { RequestUser } from '../common/types/request-user.type';
import { AlertsService } from './alerts.service';
export declare class AlertsController {
    private readonly alertsService;
    constructor(alertsService: AlertsService);
    list(req: {
        user: RequestUser;
    }): import("@prisma/client").Prisma.PrismaPromise<({
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
    acknowledge(req: {
        user: RequestUser;
    }, id: string): Promise<{
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
