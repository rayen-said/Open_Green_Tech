import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
<<<<<<< HEAD

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
=======
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('api');
  app.useLogger(app.get(Logger));

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
