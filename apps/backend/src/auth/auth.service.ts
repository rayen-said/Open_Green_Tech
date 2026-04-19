import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { compare, hash } from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new UnauthorizedException('Email is already used.');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        fullName: dto.fullName,
        passwordHash,
        role: Role.USER,
      },
    });

    return this.issueTokens(user.id, user.email, user.fullName, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordOk = await compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(user.id, user.email, user.fullName, user.role);
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.jwtService.verifyAsync<{ sub: string; email: string; role: Role }>(
      dto.refreshToken,
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'change-this-refresh-secret',
      },
    );

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token invalid.');
    }

    const refreshOk = await compare(dto.refreshToken, user.refreshTokenHash);
    if (!refreshOk) {
      throw new UnauthorizedException('Refresh token invalid.');
    }

    return this.issueTokens(user.id, user.email, user.fullName, user.role);
  }

  async logout(dto: LogoutDto) {
    const payload = await this.jwtService.verifyAsync<{ sub: string }>(dto.refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'change-this-refresh-secret',
    });

    await this.prisma.user.updateMany({
      where: { id: payload.sub },
      data: { refreshTokenHash: null },
    });

    return { success: true };
  }

  async me(userId: string) {
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
      throw new UnauthorizedException('User not found.');
    }

    return user;
  }

  private async issueTokens(
    userId: string,
    email: string,
    fullName: string,
    role: Role,
  ) {
    const payload = { sub: userId, email, role };
    const jwtExpiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ?? '7d') as any;
    const refreshExpiresIn = (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d') as any;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET') ?? 'change-this-secret',
      expiresIn: jwtExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'change-this-refresh-secret',
      expiresIn: refreshExpiresIn,
    });

    const refreshTokenHash = await hash(refreshToken, 10);

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
}
