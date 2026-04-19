import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
<<<<<<< HEAD
  getHello(): string {
    return 'Hello World!';
=======
  getHealth() {
    return {
      service: 'crop-advisor-api',
      status: 'ok',
      now: new Date().toISOString(),
    };
>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
  }
}
