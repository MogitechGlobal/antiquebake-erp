// api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS for the Next.js Frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // 2. Enable Global Validation for all incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any properties without decorators
      forbidNonWhitelisted: true, // Throws an error if extra properties are sent
      transform: true, // Automatically transforms payloads to DTO instances
    }),
  );

  // 3. Set an API Prefix for clean routing
  app.setGlobalPrefix('api/v1');

  // 4. Start the server on port 3001 to keep 3000 free for Next.js
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`AntiqueBake ERP API is running on: http://localhost:${port}/api/v1`);
}
bootstrap();