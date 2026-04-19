import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { verify } from 'jsonwebtoken';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type WsJwtPayload = {
  sub: string;
  role: Role;
};

type TelemetryRealtimePayload = {
  ownerId: string;
  telemetry: unknown;
};

type AlertRealtimePayload = {
  userId?: string | null;
  [key: string]: unknown;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TelemetryGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly configService: ConfigService) {}

  handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = verify(token, this.jwtSecret()) as WsJwtPayload;
      if (!payload?.sub || !payload?.role) {
        client.disconnect(true);
        return;
      }

      void client.join(this.userRoom(payload.sub));
      if (payload.role === Role.ADMIN) {
        void client.join(this.adminRoom());
      }
    } catch {
      client.disconnect(true);
    }
  }

  emitTelemetry(payload: TelemetryRealtimePayload) {
    this.server
      .to([this.userRoom(payload.ownerId), this.adminRoom()])
      .emit('telemetry:update', payload.telemetry);
  }

  emitAlert(payload: AlertRealtimePayload) {
    if (payload.userId) {
      this.server
        .to([this.userRoom(payload.userId), this.adminRoom()])
        .emit('alerts:new', payload);
      return;
    }

    this.server.to(this.adminRoom()).emit('alerts:new', payload);
  }

  @SubscribeMessage('telemetry:ping')
  onPing(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    if (!client.rooms.has(this.adminRoom()) && client.rooms.size <= 1) {
      throw new WsException('Unauthorized websocket client');
    }

    return {
      ok: true,
      body,
      at: new Date().toISOString(),
    };
  }

  private extractToken(client: Socket): string | null {
    const rawAuthUnknown =
      (client.handshake.auth as { token?: unknown } | undefined)?.token ??
      client.handshake.headers.authorization;

    if (typeof rawAuthUnknown !== 'string' || !rawAuthUnknown) {
      return null;
    }

    return rawAuthUnknown.startsWith('Bearer ')
      ? rawAuthUnknown.slice(7)
      : rawAuthUnknown;
  }

  private jwtSecret(): string {
    const jwtSecret = this.configService.get<string>('JWT_SECRET')?.trim();
    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be defined');
    }
    return jwtSecret;
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private adminRoom(): string {
    return 'role:ADMIN';
  }
}
