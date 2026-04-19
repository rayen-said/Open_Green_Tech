import { PrismaService } from '../prisma/prisma.service';
import { TelemetryService } from '../telemetry/telemetry.service';
export declare class DemoService {
    private readonly prisma;
    private readonly telemetryService;
    private timer;
    private tick;
    private startedAt;
    constructor(prisma: PrismaService, telemetryService: TelemetryService);
    start(options?: {
        resetData?: boolean;
        intervalMs?: number;
    }): Promise<{
        running: boolean;
        startedAt: string;
        intervalMs: number;
        devices: {
            id: string;
            name: string;
        }[];
    }>;
    stop(): {
        running: boolean;
        startedAt: string | null;
        ticksSent: number;
    };
    status(): {
        running: boolean;
        startedAt: string | null;
        ticksSent: number;
    };
}
