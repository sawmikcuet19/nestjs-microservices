import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from '@app/common';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(
    @Body() createEventDto: CreateEventDto,
    @Req() req: any,
  ) {
    return this.eventsService.create(
      createEventDto,
      req.user.sub,
      req.user.role,
    );
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get('my-events')
  @UseGuards(AuthGuard('jwt'))
  findMyEvents(@Req() req: any) {
    return this.eventsService.findMyEvents(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: any,
  ) {
    return this.eventsService.update(
      id,
      updateEventDto,
      req.user.sub,
      req.user.role,
    );
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  publish(@Param('id') id: string, @Req() req: any) {
    return this.eventsService.publish(id, req.user.sub, req.user.role);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.eventsService.cancel(id, req.user.sub, req.user.role);
  }
}