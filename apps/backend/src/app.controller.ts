import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
<<<<<<< HEAD
=======
import { Public } from './common/decorators/public.decorator';
>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

<<<<<<< HEAD
  @Get()
  getHello(): string {
    return this.appService.getHello();
=======
  @Public()
  @Get()
  getHealth() {
    return this.appService.getHealth();
>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
  }
}
