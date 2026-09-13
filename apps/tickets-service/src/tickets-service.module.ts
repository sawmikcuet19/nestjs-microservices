import { Module } from '@nestjs/common';
import { KafkaModule } from '@app/kafka';
import { DatabaseModule } from '@app/database';
import { TicketsController } from './tickets-service.controller';
import { TicketsService } from './tickets-service.service';

@Module({
  imports: [KafkaModule.register('tickets-service-group'), DatabaseModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class AppModule {}
