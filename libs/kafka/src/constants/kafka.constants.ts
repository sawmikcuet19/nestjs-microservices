export const KAFKA_BROKER =
  process.env.KAFKA_BROKER || 'localhost:9094';

export const KAFKA_CLIENT_ID = 'eventflowapp';

export const KAFKA_CONSUMER_GROUP = 'eventflowapp-consumer';

export const KAFKA_TOPICS = {
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',

  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_CANCELLED: 'event.cancelled',

  TICKET_PURCHASED: 'ticket.purchased',
  TICKET_CANCELLED: 'ticket.cancelled',
  TICKET_CHECKED_IN: 'ticket.checked-in',
} as const;
