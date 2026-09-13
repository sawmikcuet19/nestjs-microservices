#!/bin/bash
set -e

# Kill any existing node processes
pkill -f "node dist/apps" 2>/dev/null || true
sleep 1

export DATABASE_URL="postgres://postgres:password@localhost:5433/eventflow"
export KAFKA_BROKER="localhost:9094"
export JWT_SECRET="secret"
export REDIS_HOST="localhost"
export SMTP_HOST="localhost"
export SMTP_PORT="1025"

# Start auth service
PORT=3001 node dist/apps/auth-service/main.js &
AUTH_PID=$!

# Start events service
PORT=3003 node dist/apps/events-service/main.js &
EVENTS_PID=$!

# Start tickets service
PORT=3004 node dist/apps/tickets-service/main.js &
TICKETS_PID=$!

# Start notifications service
PORT=3006 node dist/apps/notifications-service/main.js &
NOTIFICATIONS_PID=$!

# Start API gateway
PORT=3000 \
  AUTH_SERVICE_URL="http://localhost:3001" \
  EVENTS_SERVICE_URL="http://localhost:3003" \
  TICKETS_SERVICE_URL="http://localhost:3004" \
  node dist/apps/api-gateway/main.js &
GATEWAY_PID=$!

echo "Started: auth=$AUTH_PID events=$EVENTS_PID tickets=$TICKETS_PID notifications=$NOTIFICATIONS_PID gateway=$GATEWAY_PID"
echo "$AUTH_PID $EVENTS_PID $TICKETS_PID $NOTIFICATIONS_PID $GATEWAY_PID" > .pids

sleep 3
echo "Ports:"
ss -tlnp | grep -E '300[0-6]'
