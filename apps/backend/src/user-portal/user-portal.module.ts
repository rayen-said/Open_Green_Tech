import { Module } from '@nestjs/common';
import { UserPortalController } from './user-portal.controller';
import { UserGamificationService } from './user-gamification.service';
import { UserProfileService } from './user-profile.service';

@Module({
  controllers: [UserPortalController],
  providers: [UserProfileService, UserGamificationService],
  exports: [UserProfileService],
})
export class UserPortalModule {}
