import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { NotificationsServiceController } from './notifications-service.controller';
import { NotificationsServiceService } from './notifications-service.service';
import { EmailService } from './email.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsServiceController],
  providers: [NotificationsServiceService, EmailService],
})
export class AppModule {}
