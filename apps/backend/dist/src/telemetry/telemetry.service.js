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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const telemetry_gateway_1 = require("./telemetry.gateway");
let TelemetryService = class TelemetryService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async create(deviceId, userId, role, dto) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException('Device not found');
        }
        if (role !== client_1.Role.ADMIN && device.ownerId !== userId) {
            throw new common_1.ForbiddenException('You cannot push telemetry for this device');
        }
        return this.persistTelemetry(deviceId, device.ownerId, dto);
    }
    async ingestFromTrustedSource(deviceId, dto) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
            select: { id: true, ownerId: true },
        });
        if (!device) {
            throw new common_1.NotFoundException('Device not found');
        }
        return this.persistTelemetry(device.id, device.ownerId, dto);
    }
    async persistTelemetry(deviceId, ownerId, dto) {
        const telemetry = await this.prisma.telemetry.create({
            data: {
                deviceId,
                ...dto,
            },
        });
        this.gateway.emitTelemetry(telemetry);
        if (telemetry.anomaly ||
            telemetry.humidity < 25 ||
            telemetry.temperature > 38) {
            const severity = telemetry.temperature > 42
                ? client_1.AlertSeverity.CRITICAL
                : client_1.AlertSeverity.HIGH;
            const alert = await this.prisma.alert.create({
                data: {
                    deviceId,
                    userId: ownerId,
                    severity,
                    title: 'Anomaly detected',
                    message: telemetry.temperature > 38
                        ? 'Heat stress risk detected on this device.'
                        : 'Moisture anomaly detected on this device.',
                },
            });
            this.gateway.emitAlert(alert);
        }
        return telemetry;
    }
    async list(deviceId, userId, role) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException('Device not found');
        }
        if (role !== client_1.Role.ADMIN && device.ownerId !== userId) {
            throw new common_1.ForbiddenException('You cannot access this telemetry');
        }
        return this.prisma.telemetry.findMany({
            where: { deviceId },
            orderBy: { timestamp: 'desc' },
            take: 150,
        });
    }
    async latest(userId, role) {
        const devices = await this.prisma.device.findMany({
            where: role === client_1.Role.ADMIN ? {} : { ownerId: userId },
            select: { id: true, name: true },
        });
        const withTelemetry = await Promise.all(devices.map(async (device) => {
            const latest = await this.prisma.telemetry.findFirst({
                where: { deviceId: device.id },
                orderBy: { timestamp: 'desc' },
            });
            return {
                ...device,
                latest,
            };
        }));
        return withTelemetry;
    }
};
exports.TelemetryService = TelemetryService;
exports.TelemetryService = TelemetryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telemetry_gateway_1.TelemetryGateway])
], TelemetryService);
//# sourceMappingURL=telemetry.service.js.map