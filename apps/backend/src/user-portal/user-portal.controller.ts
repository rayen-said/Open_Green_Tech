import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { RequestUser } from '../common/types/request-user.type';
import {
  SyncGamificationDto,
  UpsertUserProfileDto,
} from './dto/upsert-user-profile.dto';
import { UserGamificationService } from './user-gamification.service';
import { UserProfileService } from './user-profile.service';

@Controller('user')
export class UserPortalController {
  constructor(
    private readonly profile: UserProfileService,
    private readonly gamification: UserGamificationService,
  ) {}

  @Get('profile')
  getProfile(@Req() req: { user: RequestUser }) {
    return this.profile.getResponseJson(req.user.sub);
  }

  @Post('profile')
  upsertProfile(
    @Req() req: { user: RequestUser },
    @Body() dto: UpsertUserProfileDto,
  ) {
    return this.profile.upsert(req.user.sub, dto);
  }

  @Get('gamification')
  getGamification(@Req() req: { user: RequestUser }) {
    return this.gamification.getOrCreate(req.user.sub);
  }

  @Post('gamification')
  syncGamification(
    @Req() req: { user: RequestUser },
    @Body() dto: SyncGamificationDto,
  ) {
    return this.gamification.sync(req.user.sub, dto);
  }
}
