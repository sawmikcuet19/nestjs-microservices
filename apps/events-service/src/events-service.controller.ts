import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import { EventsService } from './events-service.service';
import { CreateEventDto, UpdateEventDto } from '@app/common';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(
    @Body() createEventDto: CreateEventDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.eventsService.create(createEventDto, userId);
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get('my-events')
  findMyEvents(@Headers('x-user-id') userId: string) {
    return this.eventsService.findMyEvents(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    return this.eventsService.update(id, updateEventDto, userId, userRole);
  }

  @Post(':id/publish')
  publish(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    return this.eventsService.publish(id, userId, userRole);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    return this.eventsService.cancel(id, userId, userRole);
  }
}
