import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

type SupportedLanguage = 'en' | 'fr' | 'ar';

type ChatRole = 'user' | 'assistant';

type ChatMessageView = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

type ChatMessageRecord = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
};

type ChatMessageModel = {
  findMany(args: {
    where: { userId: string };
    orderBy: { createdAt: 'desc' };
    take: number;
  }): Promise<ChatMessageRecord[]>;
  create(args: {
    data: { userId: string; role: ChatRole; content: string };
  }): Promise<ChatMessageRecord>;
  count(args: {
    where: { userId: string; role: 'user'; createdAt: { gte: Date } };
  }): Promise<number>;
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private get chatMessages() {
    return this.prisma as PrismaService & { chatMessage: ChatMessageModel };
  }

  async getHistory(userId: string, limit = 40): Promise<ChatMessageView[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(limit, 100))
      : 40;

    const messages: ChatMessageRecord[] =
      await this.chatMessages.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
      });

    return messages.reverse().map((message) => ({
      id: message.id,
      role: message.role as ChatRole,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    }));
  }

  async sendMessage(userId: string, role: Role, dto: SendChatMessageDto) {
    const prompt = dto.prompt.trim();

    if (!prompt) {
      throw new BadRequestException('Prompt cannot be empty');
    }

    await this.enforceRateLimit(userId);

    if (dto.deviceId) {
      const device = await this.prisma.device.findUnique({
        where: { id: dto.deviceId },
      });
      if (!device) {
        throw new NotFoundException('Device not found');
      }
      if (role !== Role.ADMIN && device.ownerId !== userId) {
        throw new ForbiddenException(
          'You cannot use this device as chat context',
        );
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
    const recentMessages: ChatMessageRecord[] =
      await this.chatMessages.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

    const assistantAnswer =
      (await this.generateWithLlm(
        recentMessages.reverse(),
        contextBlock,
        language,
      )) ?? this.generateFallbackAnswer(prompt, contextBlock, language);

    const assistantMessage: ChatMessageRecord =
      await this.chatMessages.chatMessage.create({
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
        role: 'assistant' as const,
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
      history,
    };
  }

  private async enforceRateLimit(userId: string) {
    const threshold = new Date(Date.now() - 60 * 1000);
    const count = await this.chatMessages.chatMessage.count({
      where: {
        userId,
        role: 'user',
        createdAt: { gte: threshold },
      },
    });

    if (count >= 12) {
      throw new HttpException(
        'Too many messages. Please wait a minute and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private resolveLanguage(
    prompt: string,
    preferred?: SupportedLanguage,
  ): SupportedLanguage {
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

  private async buildContext(userId: string, role: Role, deviceId?: string) {
    const deviceWhere = deviceId
      ? { id: deviceId }
      : role === Role.ADMIN
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

    const latestTelemetryByDevice = new Map<
      string,
      (typeof telemetries)[number]
    >();
    for (const telemetry of telemetries) {
      if (!latestTelemetryByDevice.has(telemetry.deviceId)) {
        latestTelemetryByDevice.set(telemetry.deviceId, telemetry);
      }
    }

    const alerts = await this.prisma.alert.findMany({
      where:
        role === Role.ADMIN
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

  private async generateWithLlm(
    recentMessages: Array<{ role: string; content: string }>,
    contextBlock: unknown,
    language: SupportedLanguage,
  ): Promise<string | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return null;
    }

    const languageInstruction =
      language === 'ar'
        ? 'Reply in Tunisian Arabic (Darija) using clear, short and practical wording.'
        : language === 'en'
          ? 'Reply in English with practical and concise guidance.'
          : 'Reply in French with practical and concise guidance.';

    const client = new OpenAI({ apiKey });

    try {
      const completion = await client.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini',
        temperature: 0.25,
        messages: [
          {
            role: 'system',
            content:
              'You are Crop Advisor AI, an agricultural expert and SaaS support assistant. You must answer user questions, explain telemetry, suggest irrigation/fertilizer/crop actions, and help users navigate features in the platform. Keep responses actionable and avoid hallucinations. If context lacks data, clearly say what is missing.' +
              ` ${languageInstruction}`,
          },
          {
            role: 'system',
            content: `User operational context (JSON): ${JSON.stringify(contextBlock)}`,
          },
          ...recentMessages.map((message) => ({
            role: message.role as 'user' | 'assistant',
            content: message.content,
          })),
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim();
      return content || null;
    } catch (error) {
      this.logger.warn(
        `OpenAI chat fallback activated: ${(error as { message?: string })?.message ?? 'unknown_error'}`,
      );
      return null;
    }
  }

  private generateFallbackAnswer(
    prompt: string,
    contextBlock: {
      devices: Array<{
        name: string;
        location: string;
        cropType: string;
        latestTelemetry: {
          temperature?: number;
          humidity?: number;
          anomaly?: boolean;
        } | null;
      }>;
      alerts: Array<{ severity: string; title: string; acknowledged: boolean }>;
      recommendations: Array<{ title: string; confidence: number }>;
    },
    language: SupportedLanguage,
  ) {
    const firstDevice = contextBlock.devices[0];
    const firstTelemetry = firstDevice?.latestTelemetry;
    const openAlerts = contextBlock.alerts.filter(
      (alert) => !alert.acknowledged,
    ).length;

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
}
