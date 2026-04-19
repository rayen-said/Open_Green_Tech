<<<<<<< HEAD
import { Injectable } from '@nestjs/common';

@Injectable()
export class RecommendationsService {}
=======
import { ConfigService } from '@nestjs/config';
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, RecommendationType } from '@prisma/client';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

type LlmRecommendationPayload = {
	cropHealth?: { title: string; explanation: string; confidence: number };
	irrigation?: { title: string; explanation: string; confidence: number };
	fertilizer?: { title: string; explanation: string; confidence: number };
	bestCrop?: { title: string; explanation: string; confidence: number };
};

@Injectable()
export class RecommendationsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly configService: ConfigService,
	) {}

	private buildRules(temperature: number, humidity: number, light: number) {
		return {
			irrigation:
				humidity < 30
					? {
							title: 'Increase irrigation frequency',
							explanation:
								'Low humidity indicates water stress risk. Increase watering during early morning.',
							confidence: 88,
						}
					: {
							title: 'Maintain current irrigation',
							explanation:
								'Humidity levels are acceptable. Keep current irrigation rhythm and monitor trend.',
							confidence: 72,
						},
			cropHealth:
				temperature > 38
					? {
							title: 'Heat stress detected',
							explanation:
								'High temperature can reduce crop vitality. Use shading and hydration actions quickly.',
							confidence: 91,
						}
					: {
							title: 'Crop condition stable',
							explanation: 'Environmental values are within the healthy range for most crops.',
							confidence: 76,
						},
			fertilizer:
				light < 200
					? {
							title: 'Optimize nutrient timing',
							explanation:
								'Lower light conditions suggest reducing heavy fertilizer doses and using split applications.',
							confidence: 68,
						}
					: {
							title: 'Balanced fertilization plan',
							explanation:
								'Current light exposure supports regular fertilization with nitrogen-potassium balance.',
							confidence: 79,
						},
			bestCrop:
				temperature > 34
					? {
							title: 'Consider drought-tolerant crops',
							explanation:
								'Current conditions are favorable for olive, sorghum, or chickpea under water constraints.',
							confidence: 83,
						}
					: {
							title: 'Mixed crops are suitable',
							explanation:
								'Moderate climate allows vegetables and cereals with regular moisture monitoring.',
							confidence: 73,
						},
		};
	}

	private async generateWithLLM(latest: {
		temperature: number;
		humidity: number;
		light: number;
	}) {
		const apiKey = this.configService.get<string>('OPENAI_API_KEY');
		if (!apiKey) {
			return null;
		}

		const client = new OpenAI({ apiKey });
		const completion = await client.chat.completions.create({
			model: this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini',
			temperature: 0.2,
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content:
						'You are an agronomy assistant for a Tunisian smart farming SaaS. Return strict JSON with four objects: cropHealth, irrigation, fertilizer, bestCrop. Each object must contain title, explanation, confidence. Keep explanations practical and concise.',
				},
				{
					role: 'user',
					content: JSON.stringify({
						telemetry: latest,
						goal: 'Generate crop health, irrigation, fertilizer, and best crop recommendations.',
					}),
				},
			],
		});

		const raw = completion.choices[0]?.message?.content;
		if (!raw) {
			return null;
		}

		try {
			return JSON.parse(raw) as LlmRecommendationPayload;
		} catch {
			return null;
		}
	}

	async generate(deviceId: string, userId: string, role: Role) {
		const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
		if (!device) {
			throw new NotFoundException('Device not found');
		}

		if (role !== Role.ADMIN && device.ownerId !== userId) {
			throw new ForbiddenException('You cannot generate recommendations for this device');
		}

		const latest = await this.prisma.telemetry.findFirst({
			where: { deviceId },
			orderBy: { timestamp: 'desc' },
		});

		if (!latest) {
			throw new NotFoundException('No telemetry found for this device');
		}

		const llmRecommendations = await this.generateWithLLM(latest);
		const rules = this.buildRules(latest.temperature, latest.humidity, latest.light);
		const detectedIssues = [
			...(latest.temperature > 38 ? ['heat_stress'] : []),
			...(latest.humidity < 30 ? ['low_humidity'] : []),
			...(latest.light < 200 ? ['low_light'] : []),
		];

		await this.prisma.recommendation.deleteMany({ where: { deviceId } });

		return this.prisma.$transaction([
			this.prisma.recommendation.create({
				data: {
					deviceId,
					type: RecommendationType.CROP_HEALTH,
					title: llmRecommendations?.cropHealth?.title ?? rules.cropHealth.title,
					explanation: llmRecommendations?.cropHealth?.explanation ?? rules.cropHealth.explanation,
					reason: llmRecommendations?.cropHealth?.explanation ?? rules.cropHealth.explanation,
					detectedIssues,
					confidence: llmRecommendations?.cropHealth?.confidence ?? rules.cropHealth.confidence,
				},
			}),
			this.prisma.recommendation.create({
				data: {
					deviceId,
					type: RecommendationType.IRRIGATION,
					title: llmRecommendations?.irrigation?.title ?? rules.irrigation.title,
					explanation: llmRecommendations?.irrigation?.explanation ?? rules.irrigation.explanation,
					reason: llmRecommendations?.irrigation?.explanation ?? rules.irrigation.explanation,
					detectedIssues,
					confidence: llmRecommendations?.irrigation?.confidence ?? rules.irrigation.confidence,
				},
			}),
			this.prisma.recommendation.create({
				data: {
					deviceId,
					type: RecommendationType.FERTILIZER,
					title: llmRecommendations?.fertilizer?.title ?? rules.fertilizer.title,
					explanation: llmRecommendations?.fertilizer?.explanation ?? rules.fertilizer.explanation,
					reason: llmRecommendations?.fertilizer?.explanation ?? rules.fertilizer.explanation,
					detectedIssues,
					confidence: llmRecommendations?.fertilizer?.confidence ?? rules.fertilizer.confidence,
				},
			}),
			this.prisma.recommendation.create({
				data: {
					deviceId,
					type: RecommendationType.BEST_CROP,
					title: llmRecommendations?.bestCrop?.title ?? rules.bestCrop.title,
					explanation: llmRecommendations?.bestCrop?.explanation ?? rules.bestCrop.explanation,
					reason: llmRecommendations?.bestCrop?.explanation ?? rules.bestCrop.explanation,
					detectedIssues,
					confidence: llmRecommendations?.bestCrop?.confidence ?? rules.bestCrop.confidence,
				},
			}),
		]);
	}

	async list(deviceId: string, userId: string, role: Role) {
		const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
		if (!device) {
			throw new NotFoundException('Device not found');
		}

		if (role !== Role.ADMIN && device.ownerId !== userId) {
			throw new ForbiddenException('You cannot access these recommendations');
		}

		return this.prisma.recommendation.findMany({
			where: { deviceId },
			orderBy: { createdAt: 'desc' },
		});
	}
}
>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
