import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertSeverity } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import mqtt, { IClientOptions, MqttClient } from 'mqtt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTelemetryDto } from '../telemetry/dto/create-telemetry.dto';
import { TelemetryGateway } from '../telemetry/telemetry.gateway';
import { TelemetryService } from '../telemetry/telemetry.service';
import { PublishCommandDto } from './dto/publish-command.dto';

type IncomingPayload = Record<string, unknown>;

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient | null = null;
  private readonly telemetryTopicPattern: string;
  private readonly alertsTopicPattern: string;
  private readonly commandsTopicTemplate: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly telemetryService: TelemetryService,
    private readonly telemetryGateway: TelemetryGateway,
    private readonly prisma: PrismaService,
  ) {
    this.telemetryTopicPattern =
      this.configService.get<string>('MQTT_TELEMETRY_TOPIC') ??
      'greenhouse/+/telemetry';
    this.alertsTopicPattern =
      this.configService.get<string>('MQTT_ALERTS_TOPIC') ??
      'greenhouse/+/alerts';
    this.commandsTopicTemplate =
      this.configService.get<string>('MQTT_COMMAND_TOPIC_TEMPLATE') ??
      'greenhouse/{deviceId}/commands';
  }

  onModuleInit(): void {
    if (!this.isMqttEnabled()) {
      this.logger.log(
        'MQTT integration disabled (set MQTT_ENABLED=true to enable).',
      );
      return;
    }

    const brokerUrl = this.resolveBrokerUrl();
    if (!brokerUrl) {
      this.logger.warn(
        'MQTT is enabled but MQTT_URL or MQTT_HOST is missing. MQTT integration is skipped.',
      );
      return;
    }

    const options = this.createClientOptions();
    this.client = mqtt.connect(brokerUrl, options);

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

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.client?.end(true, undefined, () => resolve());
    });
    this.client = null;
  }

  async publishCommand(
    deviceId: string,
    command: PublishCommandDto,
    issuedByUserId: string,
  ) {
    if (!this.client || !this.client.connected) {
      throw new ServiceUnavailableException('MQTT broker is not connected.');
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

  private subscribeToTopics() {
    if (!this.client) {
      return;
    }

    this.client.subscribe(
      [this.telemetryTopicPattern, this.alertsTopicPattern],
      { qos: 1 },
      (error) => {
        if (error) {
          this.logger.error(
            `Failed to subscribe to MQTT topics: ${error.message}`,
          );
          return;
        }

        this.logger.log(
          `Subscribed to MQTT topics: ${this.telemetryTopicPattern}, ${this.alertsTopicPattern}`,
        );
      },
    );
  }

  private async handleIncomingMessage(topic: string, payloadRaw: string) {
    let payload: IncomingPayload;

    try {
      payload = JSON.parse(payloadRaw) as IncomingPayload;
    } catch {
      this.logger.warn(
        `Ignoring MQTT message with invalid JSON on topic ${topic}`,
      );
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

  private async ingestTelemetry(deviceId: string, payload: IncomingPayload) {
    const dto = plainToInstance(CreateTelemetryDto, {
      temperature: this.readNumber(payload, ['temperature', 'temp', 'tempC']),
      humidity: this.readNumber(payload, ['humidity', 'humid', 'humPct']),
      light: this.readNumber(payload, ['light', 'lux']),
      anomaly:
        this.readBoolean(payload, ['anomaly']) ??
        (this.readNumber(payload, ['anomaly_score']) ?? 0) >= 1,
    });

    const errors = await validate(dto);
    if (errors.length > 0) {
      this.logger.warn(
        `Dropped invalid telemetry from topic greenhouse/${deviceId}/telemetry`,
      );
      return;
    }

    await this.telemetryService.ingestFromTrustedSource(deviceId, dto);
  }

  private async ingestAlert(deviceId: string, payload: IncomingPayload) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      select: { ownerId: true },
    });

    if (!device) {
      this.logger.warn(
        `Dropped alert on topic greenhouse/${deviceId}/alerts because device does not exist`,
      );
      return;
    }

    const title = this.readString(payload, ['title']) ?? 'Device alert';
    const message =
      this.readString(payload, ['message', 'diagnosis']) ??
      'Alert from IoT device';

    const severityRaw =
      this.readString(payload, ['severity'])?.toUpperCase() ?? 'MEDIUM';
    const severity = (Object.values(AlertSeverity) as string[]).includes(
      severityRaw,
    )
      ? (severityRaw as AlertSeverity)
      : AlertSeverity.MEDIUM;

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

  private publish(topic: string, payload: string) {
    return new Promise<boolean>((resolve, reject) => {
      this.client?.publish(
        topic,
        payload,
        { qos: 1, retain: false },
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(true);
        },
      );
    });
  }

  private extractDeviceId(
    topic: string,
    category: 'telemetry' | 'alerts',
  ): string | null {
    const parts = topic.split('/');
    if (parts.length !== 3) {
      return null;
    }

    if (parts[0] !== 'greenhouse' || parts[2] !== category) {
      return null;
    }

    return parts[1] || null;
  }

  private readNumber(payload: IncomingPayload, keys: string[]): number | null {
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

  private readString(payload: IncomingPayload, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private readBoolean(
    payload: IncomingPayload,
    keys: string[],
  ): boolean | null {
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

  private createClientOptions(): IClientOptions {
    const username = this.configService.get<string>('MQTT_USERNAME');
    const password = this.configService.get<string>('MQTT_PASSWORD');
    const clientId =
      this.configService.get<string>('MQTT_CLIENT_ID') ??
      `crop-advisor-api-${Math.random().toString(36).slice(2, 10)}`;
    const rejectUnauthorized =
      (this.configService.get<string>('MQTT_TLS_REJECT_UNAUTHORIZED') ??
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

  private resolveBrokerUrl(): string | null {
    const explicitUrl = this.configService.get<string>('MQTT_URL');
    if (explicitUrl?.trim()) {
      return explicitUrl;
    }

    const host = this.configService.get<string>('MQTT_HOST');
    if (!host?.trim()) {
      return null;
    }

    const port = Number(this.configService.get<string>('MQTT_PORT') ?? 1883);
    const tls =
      (this.configService.get<string>('MQTT_TLS') ?? 'false') === 'true';
    const protocol = tls ? 'mqtts' : 'mqtt';

    return `${protocol}://${host}:${port}`;
  }

  private isMqttEnabled(): boolean {
    const configured = Boolean(
      this.configService.get<string>('MQTT_URL') ||
      this.configService.get<string>('MQTT_HOST'),
    );

    const raw = this.configService.get<string>('MQTT_ENABLED');
    if (!raw) {
      return configured;
    }

    return raw.trim().toLowerCase() === 'true';
  }
}
