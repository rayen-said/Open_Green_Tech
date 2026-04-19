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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsService = void 0;
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const openai_1 = __importDefault(require("openai"));
const prisma_service_1 = require("../prisma/prisma.service");
let RecommendationsService = class RecommendationsService {
    prisma;
    configService;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    buildRules(temperature, humidity, light) {
        return {
            irrigation: humidity < 30
                ? {
                    title: 'Increase irrigation frequency',
                    explanation: 'Low humidity indicates water stress risk. Increase watering during early morning.',
                    confidence: 88,
                }
                : {
                    title: 'Maintain current irrigation',
                    explanation: 'Humidity levels are acceptable. Keep current irrigation rhythm and monitor trend.',
                    confidence: 72,
                },
            cropHealth: temperature > 38
                ? {
                    title: 'Heat stress detected',
                    explanation: 'High temperature can reduce crop vitality. Use shading and hydration actions quickly.',
                    confidence: 91,
                }
                : {
                    title: 'Crop condition stable',
                    explanation: 'Environmental values are within the healthy range for most crops.',
                    confidence: 76,
                },
            fertilizer: light < 200
                ? {
                    title: 'Optimize nutrient timing',
                    explanation: 'Lower light conditions suggest reducing heavy fertilizer doses and using split applications.',
                    confidence: 68,
                }
                : {
                    title: 'Balanced fertilization plan',
                    explanation: 'Current light exposure supports regular fertilization with nitrogen-potassium balance.',
                    confidence: 79,
                },
            bestCrop: temperature > 34
                ? {
                    title: 'Consider drought-tolerant crops',
                    explanation: 'Current conditions are favorable for olive, sorghum, or chickpea under water constraints.',
                    confidence: 83,
                }
                : {
                    title: 'Mixed crops are suitable',
                    explanation: 'Moderate climate allows vegetables and cereals with regular moisture monitoring.',
                    confidence: 73,
                },
        };
    }
    async generateWithLLM(latest) {
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey) {
            return null;
        }
        const client = new openai_1.default({ apiKey });
        const completion = await client.chat.completions.create({
            model: this.configService.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'You are an agronomy assistant for a Tunisian smart farming SaaS. Return strict JSON with four objects: cropHealth, irrigation, fertilizer, bestCrop. Each object must contain title, explanation, confidence. Keep explanations practical and concise.',
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
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async generate(deviceId, userId, role) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException('Device not found');
        }
        if (role !== client_1.Role.ADMIN && device.ownerId !== userId) {
            throw new common_1.ForbiddenException('You cannot generate recommendations for this device');
        }
        const latest = await this.prisma.telemetry.findFirst({
            where: { deviceId },
            orderBy: { timestamp: 'desc' },
        });
        if (!latest) {
            throw new common_1.NotFoundException('No telemetry found for this device');
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
                    type: client_1.RecommendationType.CROP_HEALTH,
                    title: llmRecommendations?.cropHealth?.title ?? rules.cropHealth.title,
                    explanation: llmRecommendations?.cropHealth?.explanation ??
                        rules.cropHealth.explanation,
                    reason: llmRecommendations?.cropHealth?.explanation ??
                        rules.cropHealth.explanation,
                    detectedIssues,
                    confidence: llmRecommendations?.cropHealth?.confidence ??
                        rules.cropHealth.confidence,
                },
            }),
            this.prisma.recommendation.create({
                data: {
                    deviceId,
                    type: client_1.RecommendationType.IRRIGATION,
                    title: llmRecommendations?.irrigation?.title ?? rules.irrigation.title,
                    explanation: llmRecommendations?.irrigation?.explanation ??
                        rules.irrigation.explanation,
                    reason: llmRecommendations?.irrigation?.explanation ??
                        rules.irrigation.explanation,
                    detectedIssues,
                    confidence: llmRecommendations?.irrigation?.confidence ??
                        rules.irrigation.confidence,
                },
            }),
            this.prisma.recommendation.create({
                data: {
                    deviceId,
                    type: client_1.RecommendationType.FERTILIZER,
                    title: llmRecommendations?.fertilizer?.title ?? rules.fertilizer.title,
                    explanation: llmRecommendations?.fertilizer?.explanation ??
                        rules.fertilizer.explanation,
                    reason: llmRecommendations?.fertilizer?.explanation ??
                        rules.fertilizer.explanation,
                    detectedIssues,
                    confidence: llmRecommendations?.fertilizer?.confidence ??
                        rules.fertilizer.confidence,
                },
            }),
            this.prisma.recommendation.create({
                data: {
                    deviceId,
                    type: client_1.RecommendationType.BEST_CROP,
                    title: llmRecommendations?.bestCrop?.title ?? rules.bestCrop.title,
                    explanation: llmRecommendations?.bestCrop?.explanation ??
                        rules.bestCrop.explanation,
                    reason: llmRecommendations?.bestCrop?.explanation ??
                        rules.bestCrop.explanation,
                    detectedIssues,
                    confidence: llmRecommendations?.bestCrop?.confidence ??
                        rules.bestCrop.confidence,
                },
            }),
        ]);
    }
    async list(deviceId, userId, role) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException('Device not found');
        }
        if (role !== client_1.Role.ADMIN && device.ownerId !== userId) {
            throw new common_1.ForbiddenException('You cannot access these recommendations');
        }
        return this.prisma.recommendation.findMany({
            where: { deviceId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], RecommendationsService);
//# sourceMappingURL=recommendations.service.js.map