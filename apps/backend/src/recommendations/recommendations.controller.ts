<<<<<<< HEAD
import { Controller } from '@nestjs/common';

@Controller('recommendations')
export class RecommendationsController {}
=======
import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { RequestUser } from '../common/types/request-user.type';
import { GenerateRecommendationsDto } from './dto/generate-recommendations.dto';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
	constructor(private readonly recommendationsService: RecommendationsService) {}

	@Post('generate')
	generate(
		@Req() req: { user: RequestUser },
		@Body() dto: GenerateRecommendationsDto,
	) {
		return this.recommendationsService.generate(dto.deviceId, req.user.sub, req.user.role);
	}

	@Get(':deviceId')
	list(@Req() req: { user: RequestUser }, @Param('deviceId') deviceId: string) {
		return this.recommendationsService.list(deviceId, req.user.sub, req.user.role);
	}
}
>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
