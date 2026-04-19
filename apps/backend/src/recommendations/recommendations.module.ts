import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { UserPortalModule } from '../user-portal/user-portal.module';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';

@Module({
  imports: [AiModule, UserPortalModule],
  providers: [RecommendationsService],
  controllers: [RecommendationsController],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
