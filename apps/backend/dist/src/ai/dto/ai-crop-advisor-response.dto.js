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
exports.AiCropAdvisorResponseDto = void 0;
exports.isAiCropAdvisorResponse = isAiCropAdvisorResponse;
const class_validator_1 = require("class-validator");
class AiCropAdvisorResponseDto {
    health;
    irrigation;
    fertilizer;
    crops;
    warnings;
}
exports.AiCropAdvisorResponseDto = AiCropAdvisorResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiCropAdvisorResponseDto.prototype, "health", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiCropAdvisorResponseDto.prototype, "irrigation", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiCropAdvisorResponseDto.prototype, "fertilizer", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AiCropAdvisorResponseDto.prototype, "crops", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AiCropAdvisorResponseDto.prototype, "warnings", void 0);
function isAiCropAdvisorResponse(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const o = value;
    return (typeof o.health === 'string' &&
        typeof o.irrigation === 'string' &&
        typeof o.fertilizer === 'string' &&
        Array.isArray(o.crops) &&
        o.crops.every((c) => typeof c === 'string') &&
        Array.isArray(o.warnings) &&
        o.warnings.every((w) => typeof w === 'string'));
}
//# sourceMappingURL=ai-crop-advisor-response.dto.js.map