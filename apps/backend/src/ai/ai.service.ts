import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import OpenAI from 'openai';
import {
  AiCropAdvisorResponseDto,
  isAiCropAdvisorResponse,
} from './dto/ai-crop-advisor-response.dto';

export type AiTelemetryInput = {
  temperature: number;
  humidity: number;
  light: number;
  anomaly: boolean;
};

export type AiUserProfileContext = {
  soilType?: string | null;
  crops: string[];
  habits: Record<string, unknown>;
  locationText?: string | null;
  farmSizeHa?: number | null;
};

export type AiAnalyzeInput = {
  telemetry: AiTelemetryInput;
  /** 0–1 approximate anomaly rate in recent window */
  anomalyScore: number;
  /** 0–1 heuristic sensor reliability */
  reliabilityScore: number;
  profile: AiUserProfileContext | null;
  seasonHint: string;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  private seasonFromMonth(monthIndex0: number): string {
    const m = monthIndex0 + 1;
    if (m >= 3 && m <= 5) {
      return 'Spring (Northern hemisphere)';
    }
    if (m >= 6 && m <= 8) {
      return 'Summer';
    }
    if (m >= 9 && m <= 11) {
      return 'Autumn / Fall';
    }
    return 'Winter';
  }

  buildPrompt(input: AiAnalyzeInput): string {
    const t = input.telemetry;
    const p = input.profile;
    const soil = p?.soilType ?? 'unknown';
    const crops = p?.crops?.length ? p.crops.join(', ') : 'unspecified';
    const habits = JSON.stringify(p?.habits ?? {});
    const loc = p?.locationText ?? 'unspecified';
    const farm =
      p?.farmSizeHa != null && !Number.isNaN(p.farmSizeHa)
        ? `${p.farmSizeHa} ha`
        : 'unspecified';

    return `You are an agricultural expert AI.

Analyze the following data:

Telemetry:
- Temperature: ${t.temperature}
- Humidity: ${t.humidity}
- Light: ${t.light}
- Raw anomaly flag on latest reading: ${t.anomaly}

Derived anomaly score (0–1, recent window): ${input.anomalyScore.toFixed(3)}
Sensor reliability score (0–1): ${input.reliabilityScore.toFixed(3)}

User profile:
- Soil type: ${soil}
- Crops: ${crops}
- Habits: ${habits}
- Location: ${loc}
- Farm size: ${farm}
- Season context: ${input.seasonHint}

Tasks:
1. Assess crop health
2. Recommend irrigation
3. Suggest fertilizer usage
4. Recommend best crops for this season
5. Warn if system data is unreliable (use warnings array; empty if reliable)

Return STRICT JSON only (no markdown) with exactly these keys:
{
  "health": "string",
  "irrigation": "string",
  "fertilizer": "string",
  "crops": ["string"],
  "warnings": ["string"]
}`;
  }

  /**
   * Calls OpenAI when `OPENAI_API_KEY` is set; validates JSON shape.
   * Returns null if key missing, empty model output, or malformed JSON.
   */
  async analyzeStructured(
    input: AiAnalyzeInput,
  ): Promise<AiCropAdvisorResponseDto | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey?.trim()) {
      this.logger.warn('OPENAI_API_KEY not set; skipping LLM call.');
      return null;
    }

    const client = new OpenAI({ apiKey });
    const model =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const userPrompt = this.buildPrompt({
      ...input,
      seasonHint:
        input.seasonHint ||
        this.seasonFromMonth(new Date().getUTCMonth()),
    });

    let raw: string | null = null;
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.15,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a senior agronomist. Reply with a single JSON object only. No code fences.',
          },
          { role: 'user', content: userPrompt },
        ],
      });
      raw = completion.choices[0]?.message?.content?.trim() ?? null;
    } catch (e) {
      this.logger.warn(`OpenAI request failed: ${(e as Error).message}`);
      return null;
    }

    if (!raw) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      this.logger.warn('OpenAI returned non-JSON body.');
      return null;
    }

    if (!isAiCropAdvisorResponse(parsed)) {
      this.logger.warn('OpenAI JSON failed structural validation.');
      return null;
    }

    const dto = plainToInstance(AiCropAdvisorResponseDto, parsed);
    const errors = validateSync(dto, { whitelist: true });
    if (errors.length) {
      this.logger.warn(
        `OpenAI JSON failed class-validator: ${errors.map((e) => e.toString()).join('; ')}`,
      );
      return null;
    }

    return dto;
  }
}
