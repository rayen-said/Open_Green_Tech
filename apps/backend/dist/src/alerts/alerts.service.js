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
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let AlertsService = class AlertsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(userId, role) {
        return this.prisma.alert.findMany({
            where: role === client_1.Role.ADMIN ? {} : { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                device: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                    },
                },
            },
        });
    }
    async acknowledge(alertId, userId, role) {
        const alert = await this.prisma.alert.findUnique({
            where: { id: alertId },
        });
        if (!alert) {
            throw new common_1.NotFoundException('Alert not found');
        }
        if (role !== client_1.Role.ADMIN && alert.userId !== userId) {
            throw new common_1.ForbiddenException('You cannot acknowledge this alert');
        }
        return this.prisma.alert.update({
            where: { id: alertId },
            data: { acknowledged: true },
        });
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map