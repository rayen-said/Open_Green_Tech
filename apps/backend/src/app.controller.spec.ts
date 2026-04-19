import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
<<<<<<< HEAD
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
=======
    it('should return service health payload', () => {
      expect(appController.getHealth()).toMatchObject({
        service: 'crop-advisor-api',
        status: 'ok',
      });
>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
    });
  });
});
