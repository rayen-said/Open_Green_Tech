import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
<<<<<<< HEAD

@Module({
  providers: [TelemetryService],
  controllers: [TelemetryController]
})
export class TelemetryModule {}
=======
import { TelemetryGateway } from './telemetry.gateway';

@Module({
  providers: [TelemetryService, TelemetryGateway],
  controllers: [TelemetryController],
  exports: [TelemetryService, TelemetryGateway],
})
export class TelemetryModule {}

>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
