import { pgTable, uuid, varchar, text, integer, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const eventStatusEnum = pgEnum('event_status', ['DRAFT', 'PUBLISHED', 'CANCELLED']);

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  capacity: integer('capacity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).default('0'),
  status: eventStatusEnum('status').default('DRAFT').notNull(),
  organizerId: uuid('organizer_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
