import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import { TicketsService } from './tickets-service.service';
import { PurchaseTicketDto, CheckInTicketDto } from '@app/common';

@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('purchase')
  purchase(
    @Body() purchaseTicketDto: PurchaseTicketDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.ticketsService.purchase(purchaseTicketDto, userId);
  }

  @Get('my-tickets')
  findMyTickets(@Headers('x-user-id') userId: string) {
    return this.ticketsService.findMyTickets(userId);
  }

  @Get('event/:eventId')
  findByEvent(
    @Param('eventId') eventId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    return this.ticketsService.findByEvent(eventId, userId, userRole);
  }

  @Post('check-in')
  checkIn(
    @Body() checkInTicketDto: CheckInTicketDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    return this.ticketsService.checkIn(checkInTicketDto, userId, userRole);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.ticketsService.findOne(id, userId);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.ticketsService.cancel(id, userId);
  }
}
