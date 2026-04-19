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
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let DevicesService = class DevicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(ownerId, dto) {
        return this.prisma.device.create({
            data: {
                ...dto,
                ownerId,
            },
        });
    }
    findAll(userId, role) {
        return this.prisma.device.findMany({
            where: role === client_1.Role.ADMIN ? {} : { ownerId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
    }
    async findOne(id, userId, role) {
        const device = await this.prisma.device.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
        if (!device) {
            throw new common_1.NotFoundException('Device not found');
        }
        if (role !== client_1.Role.ADMIN && device.ownerId !== userId) {
            throw new common_1.ForbiddenException('You cannot access this device');
        }
        return device;
    }
    async update(id, userId, role, dto) {
        await this.findOne(id, userId, role);
        return this.prisma.device.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id, userId, role) {
        await this.findOne(id, userId, role);
        await this.prisma.device.delete({ where: { id } });
        return { success: true };
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DevicesService);
//# sourceMappingURL=devices.service.js.map