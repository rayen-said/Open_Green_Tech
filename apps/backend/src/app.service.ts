import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'crop-advisor-api',
      status: 'ok',
      now: new Date().toISOString(),
    };
  }
}
