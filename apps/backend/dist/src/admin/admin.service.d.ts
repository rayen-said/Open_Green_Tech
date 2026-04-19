import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    overview(): Promise<{
        totalUsers: number;
        totalDevices: number;
        anomaliesDetected: number;
        liveTelemetry24h: number;
        alertsOpen: number;
        kpiSeries: {
            label: string;
            value: number;
        }[];
        topProblemDevices: {
            deviceId: string;
            deviceName: string;
            location: string;
            anomalies: number;
        }[];
        recentActivity: ({
            device: {
                id: string;
                name: string;
                location: string;
            };
        } & {
            id: string;
            deviceId: string;
            temperature: number;
            humidity: number;
            light: number;
            anomaly: boolean;
            timestamp: Date;
        })[];
    }>;
}
