import { ConfigService } from '@nestjs/config';
import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
type TelemetryRealtimePayload = {
    ownerId: string;
    telemetry: unknown;
};
type AlertRealtimePayload = {
    userId?: string | null;
    [key: string]: unknown;
};
export declare class TelemetryGateway implements OnGatewayConnection {
    private readonly configService;
    server: Server;
    constructor(configService: ConfigService);
    handleConnection(client: Socket): void;
    emitTelemetry(payload: TelemetryRealtimePayload): void;
    emitAlert(payload: AlertRealtimePayload): void;
    onPing(client: Socket, body: unknown): {
        ok: boolean;
        body: unknown;
        at: string;
    };
    private extractToken;
    private jwtSecret;
    private userRoom;
    private adminRoom;
}
export {};
