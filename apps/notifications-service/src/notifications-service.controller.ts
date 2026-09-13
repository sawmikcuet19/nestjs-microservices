import { Controller, Get, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { NotificationsServiceService } from './notifications-service.service';
import { KAFKA_TOPICS } from '@app/kafka';

@Controller()
export class NotificationsServiceController {
  private readonly logger = new Logger(NotificationsServiceController.name);

  constructor(
    private readonly notificationsService: NotificationsServiceService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'notifications-service' };
  }

  @EventPattern(KAFKA_TOPICS.USER_REGISTERED)
  async handleUserRegistered(data: any) {
    this.logger.log(`Received ${KAFKA_TOPICS.USER_REGISTERED} event`);
    await this.notificationsService.sendWelcomeEmail(data);
  }

  @EventPattern(KAFKA_TOPICS.TICKET_PURCHASED)
  async handleTicketPurchased(data: any) {
    this.logger.log(`Received ${KAFKA_TOPICS.TICKET_PURCHASED} event`);
    await this.notificationsService.sendTicketConfirmationEmail(data);
  }

  @EventPattern(KAFKA_TOPICS.TICKET_CANCELLED)
  async handleTicketCancelled(data: any) {
    this.logger.log(`Received ${KAFKA_TOPICS.TICKET_CANCELLED} event`);
    await this.notificationsService.sendTicketCancellationEmail(data);
  }
}
