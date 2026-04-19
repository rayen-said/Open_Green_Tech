import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryGateway } from './telemetry.gateway';

@Module({
  providers: [TelemetryService, TelemetryGateway],
  controllers: [TelemetryController],
  exports: [TelemetryService, TelemetryGateway],
})
export class TelemetryModule {}
