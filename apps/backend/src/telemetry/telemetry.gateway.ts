import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TelemetryGateway {
  @WebSocketServer()
  server!: Server;

  emitTelemetry(payload: unknown) {
    this.server.emit('telemetry:update', payload);
  }

  emitAlert(payload: unknown) {
    this.server.emit('alerts:new', payload);
  }

  @SubscribeMessage('telemetry:ping')
  onPing(@MessageBody() body: unknown) {
    return {
      ok: true,
      body,
      at: new Date().toISOString(),
    };
  }
}
