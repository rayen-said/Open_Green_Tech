import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';

@Module({
  providers: [RecommendationsService],
<<<<<<< HEAD
  controllers: [RecommendationsController]
})
export class RecommendationsModule {}
=======
  controllers: [RecommendationsController],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}

>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
