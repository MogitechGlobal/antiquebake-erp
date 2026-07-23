import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- 1. CONFIGURE CORS ---
  app.enableCors({
    origin: [
      'https://antiqueoven.mogitechglobal.com',
      'https://www.antiqueoven.mogitechglobal.com',
      'https://antiquebake-erp.pages.dev', 
      'http://localhost:3000',             
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // --- 2. GLOBAL PIPES ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // --- 3. GLOBAL PREFIX ---
  // This automatically prepends '/api/v1' to every controller in the app
  app.setGlobalPrefix('api/v1');

  // --- 4. START SERVER ---
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend API is running on: ${await app.getUrl()}`);
}

bootstrap();