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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcryptjs_1 = require("bcryptjs");
const client_1 = require("@prisma/client");
function parseExpiryToSeconds(value, fallbackSeconds) {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) {
        return fallbackSeconds;
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 60 * 60 * 24,
    };
    return amount * multipliers[unit];
}
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async signup(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existing) {
            throw new common_1.UnauthorizedException('Email is already used.');
        }
        const passwordHash = await (0, bcryptjs_1.hash)(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                fullName: dto.fullName,
                passwordHash,
                role: client_1.Role.USER,
            },
        });
        return this.issueTokens(user.id, user.email, user.fullName, user.role);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const passwordOk = await (0, bcryptjs_1.compare)(dto.password, user.passwordHash);
        if (!passwordOk) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        return this.issueTokens(user.id, user.email, user.fullName, user.role);
    }
    async refresh(dto) {
        const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
            secret: this.configService.get('JWT_REFRESH_SECRET') ??
                'change-this-refresh-secret',
        });
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Refresh token invalid.');
        }
        const refreshOk = await (0, bcryptjs_1.compare)(dto.refreshToken, user.refreshTokenHash);
        if (!refreshOk) {
            throw new common_1.UnauthorizedException('Refresh token invalid.');
        }
        return this.issueTokens(user.id, user.email, user.fullName, user.role);
    }
    async logout(dto) {
        const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
            secret: this.configService.get('JWT_REFRESH_SECRET') ??
                'change-this-refresh-secret',
        });
        await this.prisma.user.updateMany({
            where: { id: payload.sub },
            data: { refreshTokenHash: null },
        });
        return { success: true };
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found.');
        }
        return user;
    }
    async issueTokens(userId, email, fullName, role) {
        const payload = { sub: userId, email, role };
        const jwtExpiresIn = parseExpiryToSeconds(this.configService.get('JWT_EXPIRES_IN') ?? '7d', 60 * 60 * 24 * 7);
        const refreshExpiresIn = parseExpiryToSeconds(this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '30d', 60 * 60 * 24 * 30);
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_SECRET') ?? 'change-this-secret',
            expiresIn: jwtExpiresIn,
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET') ??
                'change-this-refresh-secret',
            expiresIn: refreshExpiresIn,
        });
        const refreshTokenHash = await (0, bcryptjs_1.hash)(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash },
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: userId,
                email,
                fullName,
                role,
            },
            expiresIn: String(jwtExpiresIn),
            refreshExpiresIn: String(refreshExpiresIn),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map