import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { DatabaseService } from '@app/database';
import { tickets, events } from '@app/database';
import { eq, and, sql } from 'drizzle-orm';
import * as crypto from 'crypto';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  private generateTicketCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  async purchase(data: { eventId: string; quantity: number }, userId: string) {
    const [event] = await this.databaseService.db
      .select()
      .from(events)
      .where(eq(events.id, data.eventId))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException('Event is not available for ticket purchase');
    }

    const totalSoldResult = await this.databaseService.db
      .select({ total: sql<number>`coalesce(sum(${tickets.quantity}), 0)` })
      .from(tickets)
      .where(
        and(
          eq(tickets.eventId, data.eventId),
          sql`${tickets.status} != 'CANCELLED'`,
        ),
      );

    const totalSold = Number(totalSoldResult[0]?.total || 0);

    if (totalSold + data.quantity > event.capacity) {
      throw new BadRequestException('Not enough capacity');
    }

    const ticketCode = this.generateTicketCode();
    const totalPrice = Number(event.price || 0) * data.quantity;

    const [newTicket] = await this.databaseService.db
      .insert(tickets)
      .values({
        eventId: data.eventId,
        userId,
        quantity: data.quantity,
        totalPrice,
        ticketCode,
        status: 'CONFIRMED',
      })
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.TICKET_PURCHASED, {
      ticketId: newTicket.id,
      eventId: data.eventId,
      userId,
      quantity: data.quantity,
      ticketCode,
    });

    return newTicket;
  }

  async findMyTickets(userId: string) {
    return this.databaseService.db
      .select({
        id: tickets.id,
        eventId: tickets.eventId,
        userId: tickets.userId,
        quantity: tickets.quantity,
        totalPrice: tickets.totalPrice,
        status: tickets.status,
        ticketCode: tickets.ticketCode,
        purchasedAt: tickets.purchasedAt,
        checkedInAt: tickets.checkedInAt,
        createdAt: tickets.createdAt,
        eventTitle: events.title,
        eventDate: events.date,
        eventLocation: events.location,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.userId, userId));
  }

  async findOne(id: string, userId: string) {
    const [ticket] = await this.databaseService.db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('Not authorized to view this ticket');
    }

    return ticket;
  }

  async cancel(id: string, userId: string) {
    const [ticket] = await this.databaseService.db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this ticket');
    }

    if (ticket.status === 'CANCELLED') {
      throw new BadRequestException('Ticket is already cancelled');
    }

    if (ticket.status === 'CHECKED_IN') {
      throw new BadRequestException('Cannot cancel a checked-in ticket');
    }

    const [cancelledTicket] = await this.databaseService.db
      .update(tickets)
      .set({ status: 'CANCELLED' })
      .where(eq(tickets.id, id))
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.TICKET_CANCELLED, {
      ticketId: cancelledTicket.id,
      eventId: ticket.eventId,
      userId: ticket.userId,
    });

    return cancelledTicket;
  }

  async checkIn(data: { ticketCode: string }, userId: string, userRole: string) {
    const [ticket] = await this.databaseService.db
      .select()
      .from(tickets)
      .where(eq(tickets.ticketCode, data.ticketCode))
      .limit(1);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const [event] = await this.databaseService.db
      .select()
      .from(events)
      .where(eq(events.id, ticket.eventId))
      .limit(1);

    if (event?.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to check in this ticket');
    }

    if (ticket.status === 'CHECKED_IN') {
      throw new ConflictException('Ticket is already checked in');
    }

    if (ticket.status === 'CANCELLED') {
      throw new BadRequestException('Cannot check in a cancelled ticket');
    }

    const [checkedInTicket] = await this.databaseService.db
      .update(tickets)
      .set({ status: 'CHECKED_IN', checkedInAt: new Date() })
      .where(eq(tickets.id, ticket.id))
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.TICKET_CHECKED_IN, {
      ticketId: checkedInTicket.id,
      eventId: ticket.eventId,
      userId: ticket.userId,
    });

    return checkedInTicket;
  }

  async findByEvent(eventId: string, userId: string, userRole: string) {
    const [event] = await this.databaseService.db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to view tickets for this event');
    }

    return this.databaseService.db
      .select()
      .from(tickets)
      .where(eq(tickets.eventId, eventId));
  }
}
