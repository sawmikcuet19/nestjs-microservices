import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { JwtStrategy } from '../jwt.strategy';

@Module({
  imports: [HttpModule, PassportModule],
  controllers: [EventsController],
  providers: [EventsService, JwtStrategy],
})
export class EventsModule {}