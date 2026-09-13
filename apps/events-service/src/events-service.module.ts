import { Module } from '@nestjs/common';
import { KafkaModule } from '@app/kafka';
import { DatabaseModule } from '@app/database';
import { EventsController } from './events-service.controller';
import { EventsService } from './events-service.service';

@Module({
  imports: [KafkaModule.register('events-service-group'), DatabaseModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class AppModule {}
