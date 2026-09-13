import { pgTable, uuid, varchar, integer, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { events } from './events';

export const ticketStatusEnum = pgEnum('ticket_status', [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CANCELLED',
]);

export const tickets = pgTable('tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  quantity: integer('quantity').notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  status: ticketStatusEnum('status').default('CONFIRMED').notNull(),
  ticketCode: varchar('ticket_code', { length: 20 }).notNull().unique(),
  purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
  checkedInAt: timestamp('checked_in_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
