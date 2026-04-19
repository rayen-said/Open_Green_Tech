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
var MqttService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const mqtt_1 = __importDefault(require("mqtt"));
const prisma_service_1 = require("../prisma/prisma.service");
const create_telemetry_dto_1 = require("../telemetry/dto/create-telemetry.dto");
const telemetry_gateway_1 = require("../telemetry/telemetry.gateway");
const telemetry_service_1 = require("../telemetry/telemetry.service");
let MqttService = MqttService_1 = class MqttService {
    configService;
    telemetryService;
    telemetryGateway;
    prisma;
    logger = new common_1.Logger(MqttService_1.name);
    client = null;
    telemetryTopicPattern;
    alertsTopicPattern;
    commandsTopicTemplate;
    constructor(configService, telemetryService, telemetryGateway, prisma) {
        this.configService = configService;
        this.telemetryService = telemetryService;
        this.telemetryGateway = telemetryGateway;
        this.prisma = prisma;
        this.telemetryTopicPattern =
            this.configService.get('MQTT_TELEMETRY_TOPIC') ??
                'greenhouse/+/telemetry';
        this.alertsTopicPattern =
            this.configService.get('MQTT_ALERTS_TOPIC') ??
                'greenhouse/+/alerts';
        this.commandsTopicTemplate =
            this.configService.get('MQTT_COMMAND_TOPIC_TEMPLATE') ??
                'greenhouse/{deviceId}/commands';
    }
    onModuleInit() {
        if (!this.isMqttEnabled()) {
            this.logger.log('MQTT integration disabled (set MQTT_ENABLED=true to enable).');
            return;
        }
        const brokerUrl = this.resolveBrokerUrl();
        if (!brokerUrl) {
            this.logger.warn('MQTT is enabled but MQTT_URL or MQTT_HOST is missing. MQTT integration is skipped.');
            return;
        }
        const options = this.createClientOptions();
        this.client = mqtt_1.default.connect(brokerUrl, options);
        this.client.on('connect', () => {
            this.logger.log(`Connected to MQTT broker at ${brokerUrl}`);
            this.subscribeToTopics();
        });
        this.client.on('reconnect', () => {
            this.logger.warn('Reconnecting to MQTT broker...');
        });
        this.client.on('error', (error) => {
            this.logger.error(`MQTT client error: ${error.message}`);
        });
        this.client.on('message', (topic, payloadBuffer) => {
            void this.handleIncomingMessage(topic, payloadBuffer.toString('utf-8'));
        });
    }
    async onModuleDestroy() {
        if (!this.client) {
            return;
        }
        await new Promise((resolve) => {
            this.client?.end(true, undefined, () => resolve());
        });
        this.client = null;
    }
    async publishCommand(deviceId, command, issuedByUserId) {
        if (!this.client || !this.client.connected) {
            throw new common_1.ServiceUnavailableException('MQTT broker is not connected.');
        }
        const topic = this.commandsTopicTemplate.replace('{deviceId}', deviceId);
        const payload = JSON.stringify({
            ...command,
            issuedAt: new Date().toISOString(),
            issuedByUserId,
        });
        const published = await this.publish(topic, payload);
        return {
            topic,
            published,
        };
    }
    subscribeToTopics() {
        if (!this.client) {
            return;
        }
        this.client.subscribe([this.telemetryTopicPattern, this.alertsTopicPattern], { qos: 1 }, (error) => {
            if (error) {
                this.logger.error(`Failed to subscribe to MQTT topics: ${error.message}`);
                return;
            }
            this.logger.log(`Subscribed to MQTT topics: ${this.telemetryTopicPattern}, ${this.alertsTopicPattern}`);
        });
    }
    async handleIncomingMessage(topic, payloadRaw) {
        let payload;
        try {
            payload = JSON.parse(payloadRaw);
        }
        catch {
            this.logger.warn(`Ignoring MQTT message with invalid JSON on topic ${topic}`);
            return;
        }
        const telemetryDeviceId = this.extractDeviceId(topic, 'telemetry');
        if (telemetryDeviceId) {
            await this.ingestTelemetry(telemetryDeviceId, payload);
            return;
        }
        const alertDeviceId = this.extractDeviceId(topic, 'alerts');
        if (alertDeviceId) {
            await this.ingestAlert(alertDeviceId, payload);
        }
    }
    async ingestTelemetry(deviceId, payload) {
        const dto = (0, class_transformer_1.plainToInstance)(create_telemetry_dto_1.CreateTelemetryDto, {
            temperature: this.readNumber(payload, ['temperature', 'temp', 'tempC']),
            humidity: this.readNumber(payload, ['humidity', 'humid', 'humPct']),
            light: this.readNumber(payload, ['light', 'lux']),
            anomaly: this.readBoolean(payload, ['anomaly']) ??
                (this.readNumber(payload, ['anomaly_score']) ?? 0) >= 1,
        });
        const errors = await (0, class_validator_1.validate)(dto);
        if (errors.length > 0) {
            this.logger.warn(`Dropped invalid telemetry from topic greenhouse/${deviceId}/telemetry`);
            return;
        }
        await this.telemetryService.ingestFromTrustedSource(deviceId, dto);
    }
    async ingestAlert(deviceId, payload) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
            select: { ownerId: true },
        });
        if (!device) {
            this.logger.warn(`Dropped alert on topic greenhouse/${deviceId}/alerts because device does not exist`);
            return;
        }
        const title = this.readString(payload, ['title']) ?? 'Device alert';
        const message = this.readString(payload, ['message', 'diagnosis']) ??
            'Alert from IoT device';
        const severityRaw = this.readString(payload, ['severity'])?.toUpperCase() ?? 'MEDIUM';
        const severity = Object.values(client_1.AlertSeverity).includes(severityRaw)
            ? severityRaw
            : client_1.AlertSeverity.MEDIUM;
        const alert = await this.prisma.alert.create({
            data: {
                deviceId,
                userId: device.ownerId,
                title,
                message,
                severity,
            },
        });
        this.telemetryGateway.emitAlert(alert);
    }
    publish(topic, payload) {
        return new Promise((resolve, reject) => {
            this.client?.publish(topic, payload, { qos: 1, retain: false }, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(true);
            });
        });
    }
    extractDeviceId(topic, category) {
        const parts = topic.split('/');
        if (parts.length !== 3) {
            return null;
        }
        if (parts[0] !== 'greenhouse' || parts[2] !== category) {
            return null;
        }
        return parts[1] || null;
    }
    readNumber(payload, keys) {
        for (const key of keys) {
            const value = payload[key];
            if (typeof value === 'number' && Number.isFinite(value)) {
                return value;
            }
            if (typeof value === 'string') {
                const parsed = Number(value);
                if (Number.isFinite(parsed)) {
                    return parsed;
                }
            }
        }
        return null;
    }
    readString(payload, keys) {
        for (const key of keys) {
            const value = payload[key];
            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }
        }
        return null;
    }
    readBoolean(payload, keys) {
        for (const key of keys) {
            const value = payload[key];
            if (typeof value === 'boolean') {
                return value;
            }
            if (typeof value === 'string') {
                if (value.toLowerCase() === 'true' || value === '1') {
                    return true;
                }
                if (value.toLowerCase() === 'false' || value === '0') {
                    return false;
                }
            }
            if (typeof value === 'number') {
                if (value === 1) {
                    return true;
                }
                if (value === 0) {
                    return false;
                }
            }
        }
        return null;
    }
    createClientOptions() {
        const username = this.configService.get('MQTT_USERNAME');
        const password = this.configService.get('MQTT_PASSWORD');
        const clientId = this.configService.get('MQTT_CLIENT_ID') ??
            `crop-advisor-api-${Math.random().toString(36).slice(2, 10)}`;
        const rejectUnauthorized = (this.configService.get('MQTT_TLS_REJECT_UNAUTHORIZED') ??
            'true') === 'true';
        return {
            clientId,
            username,
            password,
            connectTimeout: 10000,
            reconnectPeriod: 3000,
            keepalive: 30,
            protocolVersion: 4,
            rejectUnauthorized,
        };
    }
    resolveBrokerUrl() {
        const explicitUrl = this.configService.get('MQTT_URL');
        if (explicitUrl?.trim()) {
            return explicitUrl;
        }
        const host = this.configService.get('MQTT_HOST');
        if (!host?.trim()) {
            return null;
        }
        const port = Number(this.configService.get('MQTT_PORT') ?? 1883);
        const tls = (this.configService.get('MQTT_TLS') ?? 'false') === 'true';
        const protocol = tls ? 'mqtts' : 'mqtt';
        return `${protocol}://${host}:${port}`;
    }
    isMqttEnabled() {
        const configured = Boolean(this.configService.get('MQTT_URL') ||
            this.configService.get('MQTT_HOST'));
        const raw = this.configService.get('MQTT_ENABLED');
        if (!raw) {
            return configured;
        }
        return raw.trim().toLowerCase() === 'true';
    }
};
exports.MqttService = MqttService;
exports.MqttService = MqttService = MqttService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        telemetry_service_1.TelemetryService,
        telemetry_gateway_1.TelemetryGateway,
        prisma_service_1.PrismaService])
], MqttService);
//# sourceMappingURL=mqtt.service.js.map