import { Server } from 'socket.io';
export declare class TelemetryGateway {
    server: Server;
    emitTelemetry(payload: unknown): void;
    emitAlert(payload: unknown): void;
    onPing(body: unknown): {
        ok: boolean;
        body: unknown;
        at: string;
    };
}
