import { DemoService } from './demo.service';
export declare class DemoController {
    private readonly demoService;
    constructor(demoService: DemoService);
    start(body?: {
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
