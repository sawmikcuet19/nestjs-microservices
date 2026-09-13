import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './notifications-service.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter, TransformInterceptor, SERVICES_PORTS } from '@app/common';
import { KAFKA_BROKER } from '@app/kafka';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notifications-service',
        brokers: [KAFKA_BROKER],
      },
      consumer: {
        groupId: 'notifications-consumer-group',
      },
    },
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

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || SERVICES_PORTS.NOTIFICATIONS_SERVICE);
  console.log(
    `Notifications Service is running on port ${process.env.PORT || SERVICES_PORTS.NOTIFICATIONS_SERVICE}`,
  );
}
bootstrap();
