import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { DatabaseService } from '@app/database';
import { events } from '@app/database';
import { eq, and } from 'drizzle-orm';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async create(
    data: {
      title: string;
      description?: string;
      date: string;
      location: string;
      capacity: number;
      price?: number;
    },
    organizerId: string,
  ) {
    const [newEvent] = await this.databaseService.db
      .insert(events)
      .values({
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        location: data.location,
        capacity: data.capacity,
        price: data.price || 0,
        organizerId,
      })
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.EVENT_CREATED, {
      eventId: newEvent.id,
      title: newEvent.title,
      organizerId: newEvent.organizerId,
    });

    return newEvent;
  }

  async findAll() {
    return this.databaseService.db
      .select()
      .from(events)
      .where(eq(events.status, 'PUBLISHED'));
  }

  async findOne(id: string) {
    const [event] = await this.databaseService.db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async findMyEvents(organizerId: string) {
    return this.databaseService.db
      .select()
      .from(events)
      .where(eq(events.organizerId, organizerId));
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      date: string;
      location: string;
      capacity: number;
      price: number;
    }>,
    userId: string,
    userRole: string,
  ) {
    const [existingEvent] = await this.databaseService.db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    if (existingEvent.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to update this event');
    }

    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    updateData.updatedAt = new Date();

    const [updatedEvent] = await this.databaseService.db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.EVENT_UPDATED, {
      eventId: updatedEvent.id,
      title: updatedEvent.title,
    });

    return updatedEvent;
  }

  async publish(id: string, userId: string, userRole: string) {
    const [existingEvent] = await this.databaseService.db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    if (existingEvent.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to publish this event');
    }

    const [publishedEvent] = await this.databaseService.db
      .update(events)
      .set({ status: 'PUBLISHED', updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();

    return publishedEvent;
  }

  async cancel(id: string, userId: string, userRole: string) {
    const [existingEvent] = await this.databaseService.db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    if (existingEvent.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to cancel this event');
    }

    const [cancelledEvent] = await this.databaseService.db
      .update(events)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.EVENT_CANCELLED, {
      eventId: cancelledEvent.id,
      title: cancelledEvent.title,
    });

    return cancelledEvent;
  }
}
