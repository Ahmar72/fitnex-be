import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

/**
 * Fitnex Backend Application Bootstrap
 * 
 * Initializes NestJS with Swagger OpenAPI documentation, CORS,
 * global validation pipes, standardized response interceptors,
 * and exception filters.
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 5000);
  const apiPrefix = configService.get<string>('apiPrefix', 'api/v1');

  // Configure Global API Route Prefix (e.g. /api/v1)
  app.setGlobalPrefix(apiPrefix);

  // Configure CORS for Frontend Integration
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global Request Validation Pipe with automatic type conversion & sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter for standardized error format
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptors: Uniform JSON responses and Request Logging
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ==========================================
  // Swagger / OpenAPI Specification Setup
  // ==========================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fitnex API Documentation')
    .setDescription(
      'RESTful API documentation for the Fitnex fitness and nutrition web platform. Includes authentication, user profile management, metabolic calculations, workout builders, and Mailtrap notifications.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token to authenticate',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Endpoints for user registration, login, token refresh, and password recovery')
    .addTag('Users', 'Endpoints for managing authenticated user profiles and preferences')
    .addTag('Onboarding & Metabolic Calculator', 'Endpoints for Mifflin-St Jeor caloric computation and onboarding goal setup')
    .addTag('System & Health', 'Endpoints for server diagnostics, MongoDB connection state, and uptime')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    customSiteTitle: 'Fitnex API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Start HTTP Server on all network interfaces
  await app.listen(port, '0.0.0.0');
  logger.log(`====================================================`);
  logger.log(`🚀 Fitnex Backend running at: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📖 Swagger Documentation at: http://localhost:${port}/api/docs`);
  logger.log(`====================================================`);
}

bootstrap();
