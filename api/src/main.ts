import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configure CORS for both local development and Cloudflare Pages
  const allowedOrigins = [
    'http://localhost:3000',
    'https://antiquebake-erp.pages.dev'
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // 2. Enable Global Security Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any properties without decorators
      forbidNonWhitelisted: true, // Throws an error if extra properties are sent
      transform: true, // Automatically transforms payloads to DTO instances
    }),
  );

  // 3. Set an API Prefix to match the Frontend Axios requests
  app.setGlobalPrefix('api/v1');

  // 4. Bind to Render's dynamic PORT, fallback to 3001 locally
  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();