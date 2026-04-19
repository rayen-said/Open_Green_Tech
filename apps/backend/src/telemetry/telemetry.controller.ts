import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { RequestUser } from '../common/types/request-user.type';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { TelemetryService } from './telemetry.service';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('latest')
  latest(@Req() req: { user: RequestUser }) {
    return this.telemetryService.latest(req.user.sub, req.user.role);
  }

  @Get(':deviceId')
  list(@Req() req: { user: RequestUser }, @Param('deviceId') deviceId: string) {
    return this.telemetryService.list(deviceId, req.user.sub, req.user.role);
  }

  @Post(':deviceId')
  create(
    @Req() req: { user: RequestUser },
    @Param('deviceId') deviceId: string,
    @Body() dto: CreateTelemetryDto,
  ) {
    return this.telemetryService.create(
      deviceId,
      req.user.sub,
      req.user.role,
      dto,
    );
  }
}
