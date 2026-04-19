import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { RequestUser } from '../common/types/request-user.type';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@Req() req: { user: RequestUser }, @Body() dto: CreateDeviceDto) {
    return this.devicesService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Req() req: { user: RequestUser }) {
    return this.devicesService.findAll(req.user.sub, req.user.role);
  }

  @Get(':id')
  findOne(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.devicesService.findOne(id, req.user.sub, req.user.role);
  }

  @Patch(':id')
  update(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
    @Body() dto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, req.user.sub, req.user.role, dto);
  }

  @Delete(':id')
  remove(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.devicesService.remove(id, req.user.sub, req.user.role);
  }
}
