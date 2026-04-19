import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryGateway } from '../telemetry/telemetry.gateway';
import { TelemetryService } from '../telemetry/telemetry.service';
import { PublishCommandDto } from './dto/publish-command.dto';
export declare class MqttService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly telemetryService;
    private readonly telemetryGateway;
    private readonly prisma;
    private readonly logger;
    private client;
    private readonly telemetryTopicPattern;
    private readonly alertsTopicPattern;
    private readonly commandsTopicTemplate;
    constructor(configService: ConfigService, telemetryService: TelemetryService, telemetryGateway: TelemetryGateway, prisma: PrismaService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    publishCommand(deviceId: string, command: PublishCommandDto, issuedByUserId: string): Promise<{
        topic: string;
        published: boolean;
    }>;
    private subscribeToTopics;
    private handleIncomingMessage;
    private ingestTelemetry;
    private ingestAlert;
    private publish;
    private extractDeviceId;
    private readNumber;
    private readString;
    private readBoolean;
    private createClientOptions;
    private resolveBrokerUrl;
    private isMqttEnabled;
}
