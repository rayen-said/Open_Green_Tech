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
exports.MqttController = void 0;
const common_1 = require("@nestjs/common");
const devices_service_1 = require("../devices/devices.service");
const publish_command_dto_1 = require("./dto/publish-command.dto");
const mqtt_service_1 = require("./mqtt.service");
let MqttController = class MqttController {
    mqttService;
    devicesService;
    constructor(mqttService, devicesService) {
        this.mqttService = mqttService;
        this.devicesService = devicesService;
    }
    async publishDeviceCommand(req, deviceId, dto) {
        await this.devicesService.findOne(deviceId, req.user.sub, req.user.role);
        return this.mqttService.publishCommand(deviceId, dto, req.user.sub);
    }
};
exports.MqttController = MqttController;
__decorate([
    (0, common_1.Post)('devices/:deviceId/commands'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, publish_command_dto_1.PublishCommandDto]),
    __metadata("design:returntype", Promise)
], MqttController.prototype, "publishDeviceCommand", null);
exports.MqttController = MqttController = __decorate([
    (0, common_1.Controller)('mqtt'),
    __metadata("design:paramtypes", [mqtt_service_1.MqttService,
        devices_service_1.DevicesService])
], MqttController);
//# sourceMappingURL=mqtt.controller.js.map