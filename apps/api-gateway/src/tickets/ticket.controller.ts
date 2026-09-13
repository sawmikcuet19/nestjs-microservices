import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TicketsService } from './ticket.service';
import { PurchaseTicketDto, CheckInTicketDto } from '@app/common';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('purchase')
  @UseGuards(AuthGuard('jwt'))
  purchase(
    @Body() purchaseTicketDto: PurchaseTicketDto,
    @Req() req: any,
  ) {
    return this.ticketsService.purchase(purchaseTicketDto, req.user.sub);
  }

  @Get('my-tickets')
  @UseGuards(AuthGuard('jwt'))
  findMyTickets(@Req() req: any) {
    return this.ticketsService.findMyTickets(req.user.sub);
  }

  @Get('event/:eventId')
  @UseGuards(AuthGuard('jwt'))
  findByEvent(
    @Param('eventId') eventId: string,
    @Req() req: any,
  ) {
    return this.ticketsService.findByEvent(
      eventId,
      req.user.sub,
      req.user.role,
    );
  }

  @Post('check-in')
  @UseGuards(AuthGuard('jwt'))
  checkIn(
    @Body() checkInTicketDto: CheckInTicketDto,
    @Req() req: any,
  ) {
    return this.ticketsService.checkIn(
      checkInTicketDto,
      req.user.sub,
      req.user.role,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.ticketsService.findOne(id, req.user.sub);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.ticketsService.cancel(id, req.user.sub);
  }
}