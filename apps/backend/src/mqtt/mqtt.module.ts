import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { MqttController } from './mqtt.controller';
import { MqttService } from './mqtt.service';

@Module({
  imports: [TelemetryModule, DevicesModule, PrismaModule],
  providers: [MqttService],
  controllers: [MqttController],
  exports: [MqttService],
})
export class MqttModule {}
