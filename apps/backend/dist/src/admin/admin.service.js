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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async overview() {
        const [totalUsers, totalDevices, anomaliesDetected, liveTelemetry24h, alertsOpen,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.device.count(),
            this.prisma.telemetry.count({ where: { anomaly: true } }),
            this.prisma.telemetry.count({
                where: {
                    timestamp: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            }),
            this.prisma.alert.count({ where: { acknowledged: false } }),
        ]);
        const recentActivity = await this.prisma.telemetry.findMany({
            orderBy: { timestamp: 'desc' },
            take: 10,
            include: {
                device: {
                    select: { id: true, name: true, location: true },
                },
            },
        });
        const topProblemGroups = await this.prisma.telemetry.groupBy({
            by: ['deviceId'],
            where: { anomaly: true },
            _count: {
                deviceId: true,
            },
            orderBy: {
                _count: {
                    deviceId: 'desc',
                },
            },
            take: 5,
        });
        const topProblemDevices = await Promise.all(topProblemGroups.map(async (entry) => {
            const device = await this.prisma.device.findUnique({
                where: { id: entry.deviceId },
                select: { id: true, name: true, location: true },
            });
            return {
                deviceId: entry.deviceId,
                deviceName: device?.name ?? 'Unknown device',
                location: device?.location ?? '-',
                anomalies: entry._count.deviceId,
            };
        }));
        return {
            totalUsers,
            totalDevices,
            anomaliesDetected,
            liveTelemetry24h,
            alertsOpen,
            kpiSeries: [
                { label: 'Devices', value: totalDevices },
                { label: 'Anomalies', value: anomaliesDetected },
            ],
            topProblemDevices,
            recentActivity,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map