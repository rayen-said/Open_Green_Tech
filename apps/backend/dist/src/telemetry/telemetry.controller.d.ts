import { RequestUser } from '../common/types/request-user.type';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { TelemetryService } from './telemetry.service';
export declare class TelemetryController {
    private readonly telemetryService;
    constructor(telemetryService: TelemetryService);
    latest(req: {
        user: RequestUser;
    }): Promise<{
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
    list(req: {
        user: RequestUser;
    }, deviceId: string): Promise<{
        id: string;
        deviceId: string;
        temperature: number;
        humidity: number;
        light: number;
        anomaly: boolean;
        timestamp: Date;
    }[]>;
    create(req: {
        user: RequestUser;
    }, deviceId: string, dto: CreateTelemetryDto): Promise<{
        id: string;
        deviceId: string;
        temperature: number;
        humidity: number;
        light: number;
        anomaly: boolean;
        timestamp: Date;
    }>;
}
