import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryService } from './telemetry.service';
import { TelemetryGateway } from './telemetry.gateway';

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: TelemetryGateway,
          useValue: {
            emitTelemetry: jest.fn(),
            emitAlert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
