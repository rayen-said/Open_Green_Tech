<<<<<<< HEAD
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
=======
import { CanActivate, ExecutionContext, INestApplication, Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { DevicesController } from '../src/devices/devices.controller';
import { TelemetryController } from '../src/telemetry/telemetry.controller';
import { AuthService } from '../src/auth/auth.service';
import { DevicesService } from '../src/devices/devices.service';
import { TelemetryService } from '../src/telemetry/telemetry.service';

@Injectable()
class TestGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requestObject = context.switchToHttp().getRequest();
    requestObject.user = {
      sub: 'user-1',
      email: 'user@agri.com',
      role: 'USER',
    };
    return true;
  }
}

describe('Crop Advisor API e2e', () => {
>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
<<<<<<< HEAD
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
=======
      controllers: [AuthController, DevicesController, TelemetryController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: TestGuard,
        },
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
              user: {
                id: 'user-1',
                email: 'user@agri.com',
                fullName: 'Farmer One',
                role: 'USER',
              },
            }),
          },
        },
        {
          provide: DevicesService,
          useValue: {
            create: jest.fn().mockResolvedValue({
              id: 'device-1',
              name: 'Demo Sensor',
            }),
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: TelemetryService,
          useValue: {
            create: jest.fn().mockResolvedValue({
              id: 'telemetry-1',
              temperature: 29,
              humidity: 55,
              light: 310,
              anomaly: false,
            }),
            list: jest.fn().mockResolvedValue([]),
            latest: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('logs in a user', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@agri.com', password: 'Farmer@12345' })
      .expect(201)
      .expect((response) => {
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
      });
  });

  it('creates a device', () => {
    return request(app.getHttpServer())
      .post('/api/devices')
      .send({
        name: 'Demo Sensor',
        location: 'Sfax',
        soilType: 'loam',
        cropType: 'olive',
        status: 'ONLINE',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBe('device-1');
      });
  });

  it('posts telemetry', () => {
    return request(app.getHttpServer())
      .post('/api/telemetry/device-1')
      .send({
        temperature: 29,
        humidity: 55,
        light: 310,
        anomaly: false,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBe('telemetry-1');
      });
>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
  });

  afterEach(async () => {
    await app.close();
  });
});
