import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: false,
      ignoreTLS: true,
    });

    this.logger.log('Email transporter initialized');
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    await this.transporter.sendMail({
      from: '"EventFlow" <noreply@eventflow.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}
