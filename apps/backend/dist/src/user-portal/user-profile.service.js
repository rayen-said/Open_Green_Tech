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
exports.UserProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UserProfileService = class UserProfileService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getResponseJson(userId) {
        const row = await this.prisma.userProfile.findUnique({
            where: { userId },
        });
        if (!row) {
            return {
                soilType: null,
                crops: [],
                location: null,
                farmSizeHa: null,
                habits: {},
                completedOnboarding: false,
            };
        }
        const crops = Array.isArray(row.crops)
            ? row.crops.map((c) => String(c))
            : [];
        const habits = row.habits && typeof row.habits === 'object' && !Array.isArray(row.habits)
            ? row.habits
            : {};
        const location = row.lat != null && row.lng != null
            ? { lat: row.lat, lng: row.lng }
            : null;
        return {
            soilType: row.soilType,
            crops,
            location,
            farmSizeHa: row.farmSizeHa,
            habits,
            completedOnboarding: row.completedOnboarding,
        };
    }
    async upsert(userId, dto) {
        const crops = dto.crops ?? [];
        const habits = dto.habits
            ? {
                ...(dto.habits.wateringFrequency != null
                    ? { wateringFrequency: dto.habits.wateringFrequency }
                    : {}),
                ...(dto.habits.fertilizerUsage != null
                    ? { fertilizerUsage: dto.habits.fertilizerUsage }
                    : {}),
                ...(dto.habits.careMode != null ? { careMode: dto.habits.careMode } : {}),
            }
            : undefined;
        await this.prisma.userProfile.upsert({
            where: { userId },
            create: {
                userId,
                soilType: dto.soilType ?? null,
                crops,
                farmSizeHa: dto.farmSizeHa ?? null,
                lat: dto.location?.lat ?? null,
                lng: dto.location?.lng ?? null,
                habits: habits ?? {},
                completedOnboarding: dto.completedOnboarding ?? false,
            },
            update: {
                ...(dto.soilType !== undefined ? { soilType: dto.soilType } : {}),
                ...(dto.crops !== undefined ? { crops: dto.crops } : {}),
                ...(dto.farmSizeHa !== undefined ? { farmSizeHa: dto.farmSizeHa } : {}),
                ...(dto.location !== undefined
                    ? { lat: dto.location.lat, lng: dto.location.lng }
                    : {}),
                ...(habits !== undefined ? { habits } : {}),
                ...(dto.completedOnboarding !== undefined
                    ? { completedOnboarding: dto.completedOnboarding }
                    : {}),
            },
        });
        return this.getResponseJson(userId);
    }
    async toAiContext(userId) {
        const row = await this.prisma.userProfile.findUnique({
            where: { userId },
        });
        if (!row) {
            return null;
        }
        const crops = Array.isArray(row.crops)
            ? row.crops.map((c) => String(c))
            : [];
        const habits = row.habits && typeof row.habits === 'object' && !Array.isArray(row.habits)
            ? row.habits
            : {};
        const locationText = row.lat != null && row.lng != null
            ? `${row.lat.toFixed(4)}, ${row.lng.toFixed(4)}`
            : null;
        return {
            soilType: row.soilType,
            crops,
            habits,
            locationText,
            farmSizeHa: row.farmSizeHa,
        };
    }
};
exports.UserProfileService = UserProfileService;
exports.UserProfileService = UserProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserProfileService);
//# sourceMappingURL=user-profile.service.js.map