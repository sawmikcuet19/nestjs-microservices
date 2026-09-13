import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@app/database';
import { users } from '@app/database';
import { eq } from 'drizzle-orm';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsServiceService {
  private readonly logger = new Logger(NotificationsServiceService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  private async getUserEmail(userId: string): Promise<string | null> {
    const [user] = await this.databaseService.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user?.email ?? null;
  }

  async sendWelcomeEmail(data: { userId: string; email: string; name: string }) {
    try {
      await this.emailService.sendEmail({
        to: data.email,
        subject: 'Welcome to EventFlow!',
        html: `
          <h1>Welcome to EventFlow, ${data.name}!</h1>
          <p>Thank you for registering with EventFlow.</p>
          <p>You can now browse and purchase tickets for amazing events.</p>
        `,
      });
      this.logger.log(`Welcome email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${data.email}`, error);
    }
  }

  async sendTicketConfirmationEmail(data: {
    ticketId: string;
    eventId: string;
    userId: string;
    quantity: number;
    ticketCode: string;
  }) {
    try {
      const email = await this.getUserEmail(data.userId);
      if (!email) {
        this.logger.warn(`No email found for user ${data.userId}, skipping ticket confirmation`);
        return;
      }

      await this.emailService.sendEmail({
        to: email,
        subject: 'Ticket Purchase Confirmation',
        html: `
          <h1>Your tickets are confirmed!</h1>
          <p>Ticket Code: <strong>${data.ticketCode}</strong></p>
          <p>Quantity: ${data.quantity}</p>
          <p>Present this code at the event entrance.</p>
        `,
      });
      this.logger.log(`Ticket confirmation email sent for ticket ${data.ticketId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send ticket confirmation email for ticket ${data.ticketId}`,
        error,
      );
    }
  }

  async sendTicketCancellationEmail(data: {
    ticketId: string;
    eventId: string;
    userId: string;
  }) {
    try {
      const email = await this.getUserEmail(data.userId);
      if (!email) {
        this.logger.warn(`No email found for user ${data.userId}, skipping ticket cancellation`);
        return;
      }

      await this.emailService.sendEmail({
        to: email,
        subject: 'Ticket Cancellation Notice',
        html: `
          <h1>Your ticket has been cancelled</h1>
          <p>Ticket ID: ${data.ticketId}</p>
          <p>If this was a mistake, please contact support.</p>
        `,
      });
      this.logger.log(`Ticket cancellation email sent for ticket ${data.ticketId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send ticket cancellation email for ticket ${data.ticketId}`,
        error,
      );
    }
  }
}
