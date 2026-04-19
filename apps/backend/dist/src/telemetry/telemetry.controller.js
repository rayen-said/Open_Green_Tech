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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryController = void 0;
const common_1 = require("@nestjs/common");
const create_telemetry_dto_1 = require("./dto/create-telemetry.dto");
const telemetry_service_1 = require("./telemetry.service");
let TelemetryController = class TelemetryController {
    telemetryService;
    constructor(telemetryService) {
        this.telemetryService = telemetryService;
    }
    latest(req) {
        return this.telemetryService.latest(req.user.sub, req.user.role);
    }
    list(req, deviceId) {
        return this.telemetryService.list(deviceId, req.user.sub, req.user.role);
    }
    create(req, deviceId, dto) {
        return this.telemetryService.create(deviceId, req.user.sub, req.user.role, dto);
    }
};
exports.TelemetryController = TelemetryController;
__decorate([
    (0, common_1.Get)('latest'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TelemetryController.prototype, "latest", null);
__decorate([
    (0, common_1.Get)(':deviceId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TelemetryController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':deviceId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_telemetry_dto_1.CreateTelemetryDto]),
    __metadata("design:returntype", void 0)
], TelemetryController.prototype, "create", null);
exports.TelemetryController = TelemetryController = __decorate([
    (0, common_1.Controller)('telemetry'),
    __metadata("design:paramtypes", [telemetry_service_1.TelemetryService])
], TelemetryController);
//# sourceMappingURL=telemetry.controller.js.map