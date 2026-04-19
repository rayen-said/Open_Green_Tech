"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryGateway = void 0;
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = require("jsonwebtoken");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let TelemetryGateway = class TelemetryGateway {
    configService;
    server;
    constructor(configService) {
        this.configService = configService;
    }
    handleConnection(client) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                client.disconnect(true);
                return;
            }
            const payload = (0, jsonwebtoken_1.verify)(token, this.jwtSecret());
            if (!payload?.sub || !payload?.role) {
                client.disconnect(true);
                return;
            }
            void client.join(this.userRoom(payload.sub));
            if (payload.role === client_1.Role.ADMIN) {
                void client.join(this.adminRoom());
            }
        }
        catch {
            client.disconnect(true);
        }
    }
    emitTelemetry(payload) {
        this.server
            .to([this.userRoom(payload.ownerId), this.adminRoom()])
            .emit('telemetry:update', payload.telemetry);
    }
    emitAlert(payload) {
        if (payload.userId) {
            this.server
                .to([this.userRoom(payload.userId), this.adminRoom()])
                .emit('alerts:new', payload);
            return;
        }
        this.server.to(this.adminRoom()).emit('alerts:new', payload);
    }
    onPing(client, body) {
        if (!client.rooms.has(this.adminRoom()) && client.rooms.size <= 1) {
            throw new websockets_1.WsException('Unauthorized websocket client');
        }
        return {
            ok: true,
            body,
            at: new Date().toISOString(),
        };
    }
    extractToken(client) {
        const rawAuthUnknown = client.handshake.auth?.token ??
            client.handshake.headers.authorization;
        if (typeof rawAuthUnknown !== 'string' || !rawAuthUnknown) {
            return null;
        }
        return rawAuthUnknown.startsWith('Bearer ')
            ? rawAuthUnknown.slice(7)
            : rawAuthUnknown;
    }
    jwtSecret() {
        const jwtSecret = this.configService.get('JWT_SECRET')?.trim();
        if (!jwtSecret) {
            throw new Error('JWT_SECRET must be defined');
        }
        return jwtSecret;
    }
    userRoom(userId) {
        return `user:${userId}`;
    }
    adminRoom() {
        return 'role:ADMIN';
    }
};
exports.TelemetryGateway = TelemetryGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TelemetryGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('telemetry:ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], TelemetryGateway.prototype, "onPing", null);
exports.TelemetryGateway = TelemetryGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TelemetryGateway);
//# sourceMappingURL=telemetry.gateway.js.map