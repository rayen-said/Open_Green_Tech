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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const openai_1 = __importDefault(require("openai"));
const ai_crop_advisor_response_dto_1 = require("./dto/ai-crop-advisor-response.dto");
let AiService = AiService_1 = class AiService {
    configService;
    logger = new common_1.Logger(AiService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    seasonFromMonth(monthIndex0) {
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
    buildPrompt(input) {
        const t = input.telemetry;
        const p = input.profile;
        const soil = p?.soilType ?? 'unknown';
        const crops = p?.crops?.length ? p.crops.join(', ') : 'unspecified';
        const habits = JSON.stringify(p?.habits ?? {});
        const loc = p?.locationText ?? 'unspecified';
        const farm = p?.farmSizeHa != null && !Number.isNaN(p.farmSizeHa)
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
    async analyzeStructured(input) {
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey?.trim()) {
            this.logger.warn('OPENAI_API_KEY not set; skipping LLM call.');
            return null;
        }
        const client = new openai_1.default({ apiKey });
        const model = this.configService.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
        const userPrompt = this.buildPrompt({
            ...input,
            seasonHint: input.seasonHint ||
                this.seasonFromMonth(new Date().getUTCMonth()),
        });
        let raw = null;
        try {
            const completion = await client.chat.completions.create({
                model,
                temperature: 0.15,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior agronomist. Reply with a single JSON object only. No code fences.',
                    },
                    { role: 'user', content: userPrompt },
                ],
            });
            raw = completion.choices[0]?.message?.content?.trim() ?? null;
        }
        catch (e) {
            this.logger.warn(`OpenAI request failed: ${e.message}`);
            return null;
        }
        if (!raw) {
            return null;
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            this.logger.warn('OpenAI returned non-JSON body.');
            return null;
        }
        if (!(0, ai_crop_advisor_response_dto_1.isAiCropAdvisorResponse)(parsed)) {
            this.logger.warn('OpenAI JSON failed structural validation.');
            return null;
        }
        const dto = (0, class_transformer_1.plainToInstance)(ai_crop_advisor_response_dto_1.AiCropAdvisorResponseDto, parsed);
        const errors = (0, class_validator_1.validateSync)(dto, { whitelist: true });
        if (errors.length) {
            this.logger.warn(`OpenAI JSON failed class-validator: ${errors.map((e) => e.toString()).join('; ')}`);
            return null;
        }
        return dto;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map