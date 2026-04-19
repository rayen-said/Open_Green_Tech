import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

describe('TelemetryController', () => {
  let controller: TelemetryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [
        {
          provide: TelemetryService,
          useValue: {
            latest: jest.fn(),
            list: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TelemetryController>(TelemetryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
