import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { TicketsController } from './ticket.controller';
import { TicketsService } from './ticket.service';
import { JwtStrategy } from '../jwt.strategy';

@Module({
  imports: [HttpModule, PassportModule],
  controllers: [TicketsController],
  providers: [TicketsService, JwtStrategy],
})
export class TicketsModule {}