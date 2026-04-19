import { Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { RequestUser } from '../common/types/request-user.type';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  list(@Req() req: { user: RequestUser }) {
    return this.alertsService.list(req.user.sub, req.user.role);
  }

  @Patch(':id/ack')
  acknowledge(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.alertsService.acknowledge(id, req.user.sub, req.user.role);
  }
}
