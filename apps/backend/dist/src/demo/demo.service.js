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
exports.DemoService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const telemetry_service_1 = require("../telemetry/telemetry.service");
let DemoService = class DemoService {
    prisma;
    telemetryService;
    timer = null;
    tick = 0;
    startedAt = null;
    constructor(prisma, telemetryService) {
        this.prisma = prisma;
        this.telemetryService = telemetryService;
    }
    async start(options) {
        if (options?.resetData) {
            await this.prisma.alert.deleteMany();
            await this.prisma.recommendation.deleteMany();
            await this.prisma.telemetry.deleteMany();
        }
        const devices = await this.prisma.device.findMany({
            orderBy: { createdAt: 'asc' },
            take: 3,
        });
        if (devices.length === 0) {
            throw new common_1.NotFoundException('No devices available. Seed data first.');
        }
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.tick = 0;
        this.startedAt = new Date().toISOString();
        const intervalMs = Math.max(1000, options?.intervalMs ?? 2000);
        this.timer = setInterval(() => {
            void Promise.all(devices.map((device, index) => {
                const anomaly = this.tick % (6 + index) === 0;
                return this.telemetryService.create(device.id, 'demo-system', client_1.Role.ADMIN, {
                    temperature: anomaly ? 43 + (this.tick % 3) : 22 + index * 3 + (this.tick % 4),
                    humidity: anomaly ? 20 + (this.tick % 4) : 46 + ((this.tick + index) % 19),
                    light: 260 + this.tick * 8 + index * 30,
                    anomaly,
                });
            }))
                .catch(() => {
                return;
            })
                .finally(() => {
                this.tick += 1;
            });
        }, intervalMs);
        return {
            running: true,
            startedAt: this.startedAt,
            intervalMs,
            devices: devices.map((device) => ({ id: device.id, name: device.name })),
        };
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        return {
            running: false,
            startedAt: this.startedAt,
            ticksSent: this.tick,
        };
    }
    status() {
        return {
            running: Boolean(this.timer),
            startedAt: this.startedAt,
            ticksSent: this.tick,
        };
    }
};
exports.DemoService = DemoService;
exports.DemoService = DemoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telemetry_service_1.TelemetryService])
], DemoService);
//# sourceMappingURL=demo.service.js.map