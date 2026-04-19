import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role, RecommendationType } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfileService } from '../user-portal/user-profile.service';

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
    private readonly aiService: AiService,
    private readonly userProfileService: UserProfileService,
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
              explanation:
                'Environmental values are within the healthy range for most crops.',
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

  private scoreFromSeries(
    points: { anomaly: boolean; temperature: number }[],
  ): { anomalyRate: number; reliability: number } {
    if (points.length === 0) {
      return { anomalyRate: 0, reliability: 0.65 };
    }
    const anomalyCount = points.filter((p) => p.anomaly).length;
    const anomalyRate = anomalyCount / points.length;
    const mean = points.reduce((s, p) => s + p.temperature, 0) / points.length;
    let varT = 0;
    for (const p of points) {
      const d = p.temperature - mean;
      varT += d * d;
    }
    varT /= points.length;
    const spread = Math.min(varT, 25);
    const reliability = Math.min(0.98, Math.max(0.55, 0.92 - spread / 50));
    return { anomalyRate, reliability };
  }

  private mapAiToLegacyPayload(ai: {
    health: string;
    irrigation: string;
    fertilizer: string;
    crops: string[];
    warnings: string[];
  }): LlmRecommendationPayload {
    const warn =
      ai.warnings.length > 0 ? ` Warnings: ${ai.warnings.join(' | ')}` : '';
    return {
      cropHealth: {
        title: 'AI crop health assessment',
        explanation: `${ai.health}${warn}`,
        confidence: 82,
      },
      irrigation: {
        title: 'AI irrigation guidance',
        explanation: ai.irrigation,
        confidence: 80,
      },
      fertilizer: {
        title: 'AI fertilizer guidance',
        explanation: ai.fertilizer,
        confidence: 78,
      },
      bestCrop: {
        title: 'AI seasonal crop ideas',
        explanation:
          ai.crops.length > 0
            ? `Suggested crops: ${ai.crops.join(', ')}.`
            : 'Review local extension guidance for cultivars suited to your microclimate.',
        confidence: 75,
      },
    };
  }

  async generate(deviceId: string, userId: string, role: Role) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (role !== Role.ADMIN && device.ownerId !== userId) {
      throw new ForbiddenException(
        'You cannot generate recommendations for this device',
      );
    }

    const latest = await this.prisma.telemetry.findFirst({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
    });

    if (!latest) {
      throw new NotFoundException('No telemetry found for this device');
    }

    const seriesWindow = await this.prisma.telemetry.findMany({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
      take: 32,
      select: { anomaly: true, temperature: true },
    });

    const { anomalyRate, reliability } = this.scoreFromSeries(seriesWindow);

    const profileContext = await this.userProfileService.toAiContext(
      device.ownerId,
    );

    const seasonMonth = new Date().getUTCMonth();
    const seasons = [
      'Winter',
      'Winter',
      'Spring',
      'Spring',
      'Spring',
      'Summer',
      'Summer',
      'Summer',
      'Autumn / Fall',
      'Autumn / Fall',
      'Autumn / Fall',
      'Winter',
    ];
    const seasonHint = seasons[seasonMonth] ?? 'Current season';

    const structured = await this.aiService.analyzeStructured({
      telemetry: {
        temperature: latest.temperature,
        humidity: latest.humidity,
        light: latest.light,
        anomaly: latest.anomaly,
      },
      anomalyScore: anomalyRate,
      reliabilityScore: reliability,
      profile: profileContext,
      seasonHint,
    });

    const llmRecommendations = structured
      ? this.mapAiToLegacyPayload(structured)
      : null;

    const rules = this.buildRules(
      latest.temperature,
      latest.humidity,
      latest.light,
    );
    const detectedIssues = [
      ...(latest.temperature > 38 ? ['heat_stress'] : []),
      ...(latest.humidity < 30 ? ['low_humidity'] : []),
      ...(latest.light < 200 ? ['low_light'] : []),
      ...(latest.anomaly ? ['telemetry_anomaly_flag'] : []),
      ...(structured?.warnings?.length
        ? structured.warnings.map((w) => `ai_warning:${w}`)
        : []),
    ];

    await this.prisma.recommendation.deleteMany({ where: { deviceId } });

    return this.prisma.$transaction([
      this.prisma.recommendation.create({
        data: {
          deviceId,
          type: RecommendationType.CROP_HEALTH,
          title:
            llmRecommendations?.cropHealth?.title ?? rules.cropHealth.title,
          explanation:
            llmRecommendations?.cropHealth?.explanation ??
            rules.cropHealth.explanation,
          reason:
            llmRecommendations?.cropHealth?.explanation ??
            rules.cropHealth.explanation,
          detectedIssues,
          confidence:
            llmRecommendations?.cropHealth?.confidence ??
            rules.cropHealth.confidence,
        },
      }),
      this.prisma.recommendation.create({
        data: {
          deviceId,
          type: RecommendationType.IRRIGATION,
          title:
            llmRecommendations?.irrigation?.title ?? rules.irrigation.title,
          explanation:
            llmRecommendations?.irrigation?.explanation ??
            rules.irrigation.explanation,
          reason:
            llmRecommendations?.irrigation?.explanation ??
            rules.irrigation.explanation,
          detectedIssues,
          confidence:
            llmRecommendations?.irrigation?.confidence ??
            rules.irrigation.confidence,
        },
      }),
      this.prisma.recommendation.create({
        data: {
          deviceId,
          type: RecommendationType.FERTILIZER,
          title:
            llmRecommendations?.fertilizer?.title ?? rules.fertilizer.title,
          explanation:
            llmRecommendations?.fertilizer?.explanation ??
            rules.fertilizer.explanation,
          reason:
            llmRecommendations?.fertilizer?.explanation ??
            rules.fertilizer.explanation,
          detectedIssues,
          confidence:
            llmRecommendations?.fertilizer?.confidence ??
            rules.fertilizer.confidence,
        },
      }),
      this.prisma.recommendation.create({
        data: {
          deviceId,
          type: RecommendationType.BEST_CROP,
          title: llmRecommendations?.bestCrop?.title ?? rules.bestCrop.title,
          explanation:
            llmRecommendations?.bestCrop?.explanation ??
            rules.bestCrop.explanation,
          reason:
            llmRecommendations?.bestCrop?.explanation ??
            rules.bestCrop.explanation,
          detectedIssues,
          confidence:
            llmRecommendations?.bestCrop?.confidence ??
            rules.bestCrop.confidence,
        },
      }),
    ]);
  }

  async list(deviceId: string, userId: string, role: Role) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });
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
