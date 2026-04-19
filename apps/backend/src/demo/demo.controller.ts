import { Body, Controller, Get, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { DemoService } from './demo.service';

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Roles(Role.ADMIN)
  @Post('start')
  start(@Body() body?: { resetData?: boolean; intervalMs?: number }) {
    return this.demoService.start(body);
  }

  @Roles(Role.ADMIN)
  @Post('stop')
  stop() {
    return this.demoService.stop();
  }

  @Roles(Role.ADMIN)
  @Get('status')
  status() {
    return this.demoService.status();
  }
}
