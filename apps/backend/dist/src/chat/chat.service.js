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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const openai_1 = __importDefault(require("openai"));
const prisma_service_1 = require("../prisma/prisma.service");
let ChatService = ChatService_1 = class ChatService {
    prisma;
    configService;
    logger = new common_1.Logger(ChatService_1.name);
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    get chatMessages() {
        return this.prisma;
    }
    async getHistory(userId, limit = 40) {
        const safeLimit = Number.isFinite(limit)
            ? Math.max(1, Math.min(limit, 100))
            : 40;
        const messages = await this.chatMessages.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: safeLimit,
        });
        return messages.reverse().map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
        }));
    }
    async sendMessage(userId, role, dto) {
        const prompt = dto.prompt.trim();
        if (!prompt) {
            throw new common_1.BadRequestException('Prompt cannot be empty');
        }
        await this.enforceRateLimit(userId);
        if (dto.deviceId) {
            const device = await this.prisma.device.findUnique({
                where: { id: dto.deviceId },
            });
            if (!device) {
                throw new common_1.NotFoundException('Device not found');
            }
            if (role !== client_1.Role.ADMIN && device.ownerId !== userId) {
                throw new common_1.ForbiddenException('You cannot use this device as chat context');
            }
        }
        await this.chatMessages.chatMessage.create({
            data: {
                userId,
                role: 'user',
                content: prompt,
            },
        });
        const language = this.resolveLanguage(prompt, dto.language);
        const contextBlock = await this.buildContext(userId, role, dto.deviceId);
        const recentMessages = await this.chatMessages.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        const assistantAnswer = (await this.generateWithLlm(recentMessages.reverse(), contextBlock, language)) ?? this.generateFallbackAnswer(prompt, contextBlock, language);
        const assistantMessage = await this.chatMessages.chatMessage.create({
            data: {
                userId,
                role: 'assistant',
                content: assistantAnswer,
            },
        });
        const history = await this.getHistory(userId, 40);
        return {
            assistant: {
                id: assistantMessage.id,
                role: 'assistant',
                content: assistantMessage.content,
                createdAt: assistantMessage.createdAt.toISOString(),
            },
            history,
        };
    }
    async enforceRateLimit(userId) {
        const threshold = new Date(Date.now() - 60 * 1000);
        const count = await this.chatMessages.chatMessage.count({
            where: {
                userId,
                role: 'user',
                createdAt: { gte: threshold },
            },
        });
        if (count >= 12) {
            throw new common_1.HttpException('Too many messages. Please wait a minute and try again.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    resolveLanguage(prompt, preferred) {
        if (preferred) {
            return preferred;
        }
        if (/[\u0600-\u06FF]/.test(prompt)) {
            return 'ar';
        }
        const lower = prompt.toLowerCase();
        const frenchHints = [
            'bonjour',
            'pourquoi',
            'humidite',
            'temperature',
            'culture',
            'irrigation',
        ];
        const englishHints = [
            'hello',
            'why',
            'humidity',
            'temperature',
            'crop',
            'irrigation',
        ];
        if (frenchHints.some((token) => lower.includes(token))) {
            return 'fr';
        }
        if (englishHints.some((token) => lower.includes(token))) {
            return 'en';
        }
        return 'fr';
    }
    async buildContext(userId, role, deviceId) {
        const deviceWhere = deviceId
            ? { id: deviceId }
            : role === client_1.Role.ADMIN
                ? {}
                : { ownerId: userId };
        const devices = await this.prisma.device.findMany({
            where: deviceWhere,
            orderBy: { updatedAt: 'desc' },
            take: 6,
            select: {
                id: true,
                name: true,
                location: true,
                cropType: true,
                soilType: true,
                status: true,
            },
        });
        const deviceIds = devices.map((device) => device.id);
        const telemetries = deviceIds.length
            ? await this.prisma.telemetry.findMany({
                where: { deviceId: { in: deviceIds } },
                orderBy: { timestamp: 'desc' },
                take: 20,
                select: {
                    deviceId: true,
                    temperature: true,
                    humidity: true,
                    light: true,
                    anomaly: true,
                    timestamp: true,
                },
            })
            : [];
        const latestTelemetryByDevice = new Map();
        for (const telemetry of telemetries) {
            if (!latestTelemetryByDevice.has(telemetry.deviceId)) {
                latestTelemetryByDevice.set(telemetry.deviceId, telemetry);
            }
        }
        const alerts = await this.prisma.alert.findMany({
            where: role === client_1.Role.ADMIN
                ? {}
                : {
                    OR: [
                        { userId },
                        {
                            device: {
                                ownerId: userId,
                            },
                        },
                    ],
                },
            orderBy: { createdAt: 'desc' },
            take: 6,
            select: {
                title: true,
                message: true,
                severity: true,
                acknowledged: true,
                createdAt: true,
                device: {
                    select: {
                        name: true,
                        location: true,
                    },
                },
            },
        });
        const recommendations = deviceIds.length
            ? await this.prisma.recommendation.findMany({
                where: { deviceId: { in: deviceIds } },
                orderBy: { createdAt: 'desc' },
                take: 8,
                select: {
                    type: true,
                    title: true,
                    explanation: true,
                    confidence: true,
                    createdAt: true,
                    device: {
                        select: {
                            name: true,
                            cropType: true,
                        },
                    },
                },
            })
            : [];
        return {
            devices: devices.map((device) => ({
                ...device,
                latestTelemetry: latestTelemetryByDevice.get(device.id)
                    ? {
                        temperature: latestTelemetryByDevice.get(device.id)?.temperature,
                        humidity: latestTelemetryByDevice.get(device.id)?.humidity,
                        light: latestTelemetryByDevice.get(device.id)?.light,
                        anomaly: latestTelemetryByDevice.get(device.id)?.anomaly,
                        timestamp: latestTelemetryByDevice
                            .get(device.id)
                            ?.timestamp.toISOString(),
                    }
                    : null,
            })),
            alerts: alerts.map((alert) => ({
                ...alert,
                createdAt: alert.createdAt.toISOString(),
            })),
            recommendations: recommendations.map((recommendation) => ({
                ...recommendation,
                createdAt: recommendation.createdAt.toISOString(),
            })),
        };
    }
    async generateWithLlm(recentMessages, contextBlock, language) {
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey) {
            return null;
        }
        const languageInstruction = language === 'ar'
            ? 'Reply in Tunisian Arabic (Darija) using clear, short and practical wording.'
            : language === 'en'
                ? 'Reply in English with practical and concise guidance.'
                : 'Reply in French with practical and concise guidance.';
        const client = new openai_1.default({ apiKey });
        try {
            const completion = await client.chat.completions.create({
                model: this.configService.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
                temperature: 0.25,
                messages: [
                    {
                        role: 'system',
                        content: 'You are Crop Advisor AI, an agricultural expert and SaaS support assistant. You must answer user questions, explain telemetry, suggest irrigation/fertilizer/crop actions, and help users navigate features in the platform. Keep responses actionable and avoid hallucinations. If context lacks data, clearly say what is missing.' +
                            ` ${languageInstruction}`,
                    },
                    {
                        role: 'system',
                        content: `User operational context (JSON): ${JSON.stringify(contextBlock)}`,
                    },
                    ...recentMessages.map((message) => ({
                        role: message.role,
                        content: message.content,
                    })),
                ],
            });
            const content = completion.choices[0]?.message?.content?.trim();
            return content || null;
        }
        catch (error) {
            this.logger.warn(`OpenAI chat fallback activated: ${error?.message ?? 'unknown_error'}`);
            return null;
        }
    }
    generateFallbackAnswer(prompt, contextBlock, language) {
        const firstDevice = contextBlock.devices[0];
        const firstTelemetry = firstDevice?.latestTelemetry;
        const openAlerts = contextBlock.alerts.filter((alert) => !alert.acknowledged).length;
        if (language === 'ar') {
            return [
                'مرحبا! هذا رد ذكي بنمط احتياطي (بدون LLM حاليا).',
                firstDevice
                    ? `عندي بيانات من جهاز ${firstDevice.name} في ${firstDevice.location}.`
                    : 'ما لقيتش أجهزة مرتبطة بحسابك حاليا.',
                firstTelemetry
                    ? `آخر قراءة: حرارة ${firstTelemetry.temperature ?? '--'}°، رطوبة ${firstTelemetry.humidity ?? '--'}%${firstTelemetry.anomaly ? ' مع شذوذ' : ''}.`
                    : 'ما فماش قراءة حديثة للتيليمترية.',
                openAlerts > 0
                    ? `عندك ${openAlerts} تنبيهات مفتوحة، ننصحك تراجعها أولا.`
                    : 'ما عندك حتى تنبيه مفتوح حاليا.',
                contextBlock.recommendations[0]
                    ? `آخر توصية: ${contextBlock.recommendations[0].title} (ثقة ${contextBlock.recommendations[0].confidence}%).`
                    : 'انجم تولد توصيات من قسم Recommendations وقت تختار جهاز.',
                `سؤالك: "${prompt}". إذا تحب، نجاوبك خطوة بخطوة على الري، التسميد، ولا اختيار المحصول.`,
            ].join(' ');
        }
        if (language === 'en') {
            return [
                'Hello! I am running in smart fallback mode (LLM key is not configured).',
                firstDevice
                    ? `I found data for device ${firstDevice.name} in ${firstDevice.location}.`
                    : 'No device is currently linked to your account context.',
                firstTelemetry
                    ? `Latest telemetry: temperature ${firstTelemetry.temperature ?? '--'}°, humidity ${firstTelemetry.humidity ?? '--'}%${firstTelemetry.anomaly ? ', anomaly detected' : ''}.`
                    : 'No recent telemetry is available yet.',
                openAlerts > 0
                    ? `You currently have ${openAlerts} open alerts. Please review them first.`
                    : 'You currently have no open alerts.',
                contextBlock.recommendations[0]
                    ? `Latest recommendation: ${contextBlock.recommendations[0].title} (${contextBlock.recommendations[0].confidence}% confidence).`
                    : 'Generate recommendations from the Recommendations tab after selecting a device.',
                `About your question: "${prompt}", I can guide you step by step on irrigation, fertilization, and crop decisions.`,
            ].join(' ');
        }
        return [
            'Bonjour, je fonctionne en mode intelligent de secours (cle LLM non configuree).',
            firstDevice
                ? `J'ai trouve des donnees pour l'equipement ${firstDevice.name} a ${firstDevice.location}.`
                : "Aucun equipement n'est disponible dans votre contexte pour le moment.",
            firstTelemetry
                ? `Derniere mesure: temperature ${firstTelemetry.temperature ?? '--'}°, humidite ${firstTelemetry.humidity ?? '--'}%${firstTelemetry.anomaly ? ', anomalie detectee' : ''}.`
                : 'Aucune telemetrie recente disponible.',
            openAlerts > 0
                ? `Vous avez actuellement ${openAlerts} alertes ouvertes. Priorisez leur traitement.`
                : "Vous n'avez pas d'alerte ouverte actuellement.",
            contextBlock.recommendations[0]
                ? `Derniere recommandation: ${contextBlock.recommendations[0].title} (confiance ${contextBlock.recommendations[0].confidence}%).`
                : "Generez des recommandations dans la section correspondante apres selection d'un equipement.",
            `Concernant votre question "${prompt}", je peux vous guider pas a pas sur irrigation, fertilisation et choix de culture.`,
        ].join(' ');
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], ChatService);
//# sourceMappingURL=chat.service.js.map