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
exports.UserGamificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const LEVEL_BEGINNER = 'BEGINNER';
const LEVEL_INTERMEDIATE = 'INTERMEDIATE';
const LEVEL_EXPERT = 'EXPERT';
function levelFromXp(xp) {
    if (xp >= 300) {
        return LEVEL_EXPERT;
    }
    if (xp >= 100) {
        return LEVEL_INTERMEDIATE;
    }
    return LEVEL_BEGINNER;
}
function defaultTasksState() {
    return {
        version: 1,
        tasks: [
            {
                id: 'water_today',
                title: 'Water your plants today',
                xpReward: 15,
                completed: false,
            },
            {
                id: 'check_system_health',
                title: 'Check system health',
                xpReward: 10,
                completed: false,
            },
        ],
    };
}
let UserGamificationService = class UserGamificationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    mergeTasksState(existing, incoming) {
        const base = existing && typeof existing === 'object' && !Array.isArray(existing)
            ? existing
            : defaultTasksState();
        if (!incoming) {
            return base;
        }
        return { ...base, ...incoming };
    }
    async getOrCreate(userId) {
        let row = await this.prisma.userGamification.findUnique({
            where: { userId },
        });
        if (!row) {
            row = await this.prisma.userGamification.create({
                data: {
                    userId,
                    xp: 0,
                    level: LEVEL_BEGINNER,
                    tasksState: defaultTasksState(),
                },
            });
        }
        return {
            xp: row.xp,
            level: row.level,
            lastDailyCheckIn: row.lastDailyCheckIn?.toISOString() ?? null,
            tasksState: row.tasksState,
        };
    }
    async sync(userId, dto) {
        const current = await this.getOrCreate(userId);
        let xp = current.xp;
        let lastDaily = current.lastDailyCheckIn
            ? new Date(current.lastDailyCheckIn)
            : null;
        if (dto.event === 'daily_login') {
            const now = new Date();
            const sameDay = lastDaily &&
                lastDaily.getUTCFullYear() === now.getUTCFullYear() &&
                lastDaily.getUTCMonth() === now.getUTCMonth() &&
                lastDaily.getUTCDate() === now.getUTCDate();
            if (!sameDay) {
                xp += 10;
                lastDaily = now;
            }
        }
        else if (dto.event === 'follow_recommendation') {
            xp += 20;
        }
        else if (dto.event === 'water_on_time') {
            xp += 25;
        }
        else if (dto.event === 'check_system_health') {
            xp += 10;
        }
        if (dto.xpDelta != null && Number.isFinite(dto.xpDelta)) {
            xp += Math.round(dto.xpDelta);
        }
        if (xp < 0) {
            xp = 0;
        }
        const level = levelFromXp(xp);
        const tasksState = dto.tasksState
            ? this.mergeTasksState(current.tasksState, dto.tasksState)
            : current.tasksState;
        const tasksJson = tasksState;
        await this.prisma.userGamification.upsert({
            where: { userId },
            create: {
                userId,
                xp,
                level,
                lastDailyCheckIn: lastDaily,
                tasksState: tasksJson,
            },
            update: {
                xp,
                level,
                lastDailyCheckIn: lastDaily,
                tasksState: tasksJson,
            },
        });
        return this.getOrCreate(userId);
    }
};
exports.UserGamificationService = UserGamificationService;
exports.UserGamificationService = UserGamificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserGamificationService);
//# sourceMappingURL=user-gamification.service.js.map