<<<<<<< HEAD
import { Injectable } from '@nestjs/common';

@Injectable()
export class TelemetryService {}
=======
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, AlertSeverity } from '@prisma/client';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { TelemetryGateway } from './telemetry.gateway';

@Injectable()
export class TelemetryService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly gateway: TelemetryGateway,
	) {}

	async create(deviceId: string, userId: string, role: Role, dto: CreateTelemetryDto) {
		const device = await this.prisma.device.findUnique({ where: { id: deviceId } });

		if (!device) {
			throw new NotFoundException('Device not found');
		}

		if (role !== Role.ADMIN && device.ownerId !== userId) {
			throw new ForbiddenException('You cannot push telemetry for this device');
		}

		const telemetry = await this.prisma.telemetry.create({
			data: {
				deviceId,
				...dto,
			},
		});

		this.gateway.emitTelemetry(telemetry);

		if (telemetry.anomaly || telemetry.humidity < 25 || telemetry.temperature > 38) {
			const severity = telemetry.temperature > 42 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH;
			const alert = await this.prisma.alert.create({
				data: {
					deviceId,
					userId: device.ownerId,
					severity,
					title: 'Anomaly detected',
					message:
						telemetry.temperature > 38
							? 'Heat stress risk detected on this device.'
							: 'Moisture anomaly detected on this device.',
				},
			});

			this.gateway.emitAlert(alert);
		}

		return telemetry;
	}

	async list(deviceId: string, userId: string, role: Role) {
		const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
		if (!device) {
			throw new NotFoundException('Device not found');
		}

		if (role !== Role.ADMIN && device.ownerId !== userId) {
			throw new ForbiddenException('You cannot access this telemetry');
		}

		return this.prisma.telemetry.findMany({
			where: { deviceId },
			orderBy: { timestamp: 'desc' },
			take: 150,
		});
	}

	async latest(userId: string, role: Role) {
		const devices = await this.prisma.device.findMany({
			where: role === Role.ADMIN ? {} : { ownerId: userId },
			select: { id: true, name: true },
		});

		const withTelemetry = await Promise.all(
			devices.map(async (device) => {
				const latest = await this.prisma.telemetry.findFirst({
					where: { deviceId: device.id },
					orderBy: { timestamp: 'desc' },
				});
				return {
					...device,
					latest,
				};
			}),
		);

		return withTelemetry;
	}
}
>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
