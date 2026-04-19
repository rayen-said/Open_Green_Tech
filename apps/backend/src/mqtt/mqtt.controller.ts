import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { RequestUser } from '../common/types/request-user.type';
import { DevicesService } from '../devices/devices.service';
import { PublishCommandDto } from './dto/publish-command.dto';
import { MqttService } from './mqtt.service';

@Controller('mqtt')
export class MqttController {
  constructor(
    private readonly mqttService: MqttService,
    private readonly devicesService: DevicesService,
  ) {}

  @Post('devices/:deviceId/commands')
  async publishDeviceCommand(
    @Req() req: { user: RequestUser },
    @Param('deviceId') deviceId: string,
    @Body() dto: PublishCommandDto,
  ) {
    await this.devicesService.findOne(deviceId, req.user.sub, req.user.role);
    return this.mqttService.publishCommand(deviceId, dto, req.user.sub);
  }
}
