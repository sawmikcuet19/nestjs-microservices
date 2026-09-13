import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {
  AllExceptionsFilter,
  SERVICES_PORTS,
  TransformInterceptor,
} from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:4000', 'https://mytrusteddomain.com'].filter(
      Boolean,
    ),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT || SERVICES_PORTS.API_GATEWAY);
  console.log(
    `API Gateway is running on port ${process.env.PORT || SERVICES_PORTS.API_GATEWAY}`,
  );
}
bootstrap();