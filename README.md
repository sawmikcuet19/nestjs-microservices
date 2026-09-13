# EventFlow - NestJS Microservices Architecture

## Project Overview

EventFlow is a complete NestJS v12 microservices application demonstrating event-driven architecture with:
- **5 microservices** API Gateway, Auth, Events, Tickets, Notifications
- **3 shared libraries** common, database, kafka
- **PostgreSQL** for data persistence
- **Kafka** for event-driven communication (KRaft mode)
- **Redis** for caching and rate limiting
- **MailHog** for email testing

## Architecture Diagram (Mermaid)

```mermaid
flowchart TB
    subgraph Client ["Clients"]
        direction LR
        A[HTTP Client] -->|REST API| G[API Gateway (3000)]
    end

    subgraph Docker ["Docker Network"]
        direction TB
        P[PostgreSQL (5432)] -->|SQL Queries| E[Events Service (3003)]
        P -->|SQL Queries| T[Tickets Service (3004)]
        P -->|SQL Queries| Auth[Auth Service (3001)]
        N[Redis (6379)] -->|Cache/RateLimit| E
        N -->|Cache/RateLimit| T
        N -->|Cache/RateLimit| Auth
        K[Kafka (9094)] -->|Publish/Subscribe| E
        K -->|Publish/Subscribe| T
        K -->|Publish/Subscribe| Auth
        N2[MailHog (1025)] -->|Email| Auth
    end

    subgraph Local ["Local Development"]
        direction TB
        GW[API Gateway] -->|Proxies| Auth
        GW -->|Proxies| Events
        GW -->|Proxies| Tickets
        Auth -->|DB & Kafka| P
        Events -->|DB & Kafka| P
        Tickets -->|DB & Kafka| P
    end

    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style Docker fill:#bbf,stroke:#333,stroke-width:2px
    style Local fill:#cfc,stroke:#333,stroke-width:2px
```

## Project Structure

```
nestjs-microservice/
├── docker-compose.yaml       # Infrastructure (Postgres, Kafka, Redis, Mailhog)
├── Dockerfile              # Multi-stage build script
├── nest-cli.json           # Monorepo config with rspack builder
├── package.json            # Dependencies (NestJS v12, Drizzle, KafkaJS)
├── .env                    # Environment variables
├── start-local.sh          # Script to start all services locally
├── drizzle.config.ts       # Database schema migration config
├── libs/                   # Shared libraries
│   ├── common/            # DTOs, filters, interceptors, constants, utils
│   ├── database/          # Drizzle ORM schema + service
│   └── kafka/             # KafkaModule dynamic registration
├── apps/                   # Microservices applications
│   ├── api-gateway/       # Main entry point, proxies to other services
│   ├── auth-service/      # Register, login, JWT with role
│   ├── events-service/    # Event CRUD + publish/cancel
│   ├── tickets-service/   # Ticket purchase, cancel, check-in
│   └── notifications-service/ # Kafka consumer + email service
└── dist/                   # Compiled output
```

## Quick Start - Local Development

### Prerequisites

- Docker & Docker Compose installed
- Node.js v24 (for host-side scripts)
- pnpm v11.24.0

### 1. Start Infrastructure (Docker)

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on port **5432** (was 5433, now changed)
- **Kafka** on port **9094** (external) / 9092 (internal)
- **Redis** on port **6379**
- **MailHog** on ports **1025** (SMTP) / **8025** (Web UI)

### 2. Start All Microservices locally

```bash
# Using the startup script
chmod +x start-local.sh
./start-local.sh

# Or manually start each service
# Terminal 1 - Auth Service
PORT=3001 DATABASE_URL="postgres://postgres:password@localhost:5432/eventflow" \
  KAFKA_BROKER="localhost:9094" JWT_SECRET="secret" node dist/apps/auth-service/main.js

# Terminal 2 - Events Service  
PORT=3003 DATABASE_URL="postgres://postgres:password@localhost:5432/eventflow" \
  KAFKA_BROKER="localhost:9094" node dist/apps/events-service/main.js

# Terminal 3 - Tickets Service
PORT=3004 DATABASE_URL="postgres://postgres:password@localhost:5432/eventflow" \
  KAFKA_BROKER="localhost:9094" node dist/apps/tickets-service/main.js

# Terminal 4 - Notifications Service
PORT=3006 KAFKA_BROKER="localhost:9094" node dist/apps/notifications-service/main.js

# Terminal 5 - API Gateway
PORT=3000 AUTH_SERVICE_URL="http://localhost:3001" \
  EVENTS_SERVICE_URL="http://localhost:3003" \
  TICKETS_SERVICE_URL="http://localhost:3004" \
  node dist/apps/api-gateway/main.js
```

### 3. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **API Gateway** | `http://localhost:3000` | Main entry point |
| **Mailhog UI** | `http://localhost:8025` | Email testing |
| **PostgreSQL** | `postgres://postgres:password@localhost:5432/eventflow` | Database |

## API Endpoints

### Auth Service (`/auth/`)
- `POST /register` - Register new user
- `POST /login` - Login, returns JWT with `role` claim
- `GET /profile` - Get user profile (header: `x-user-id`)

### Events Service (`/events/`)
- `GET /` - List all events
- `POST /` - Create event (requires auth)
- `GET /my-events` - Get my events (requires auth)
- `GET /:id` - Get event by ID
- `PUT /:id` - Update event (requires auth + authorization)
- `POST /:id/publish` - Publish event (requires auth + authorization)
- `POST /:id/cancel` - Cancel event (requires auth + authorization)

### Tickets Service (`/tickets/`)
- `GET /my-tickets` - List my tickets (requires auth)
- `GET /:id` - Get ticket by ID (requires auth)
- `POST /purchase` - Purchase tickets (requires auth)
- `POST /:id/cancel` - Cancel ticket (requires auth)
- `POST /check-in` - Check in ticket (requires auth + authorization)

### Notifications Service (`/health`)
- `GET /health` - Health check
- Kafka consumer for: `user.registered`, `ticket.purchased`, `ticket.cancelled`

## Development Commands

### Build All Services

```bash
pnpm run build
```

### Run Lint/Typecheck

```bash
pnpm run lint
pnpm run typecheck
```

### Database Migrations

```bash
# Push schema changes to DB
pnpm db:push

# Generate new migration
pnpm dlx drizzle-kit generate
```

### Stop All Services

```bash
docker compose down --volumes
# Or via script
./start-local.sh  # (contains kill logic)
```

## Key Features Implemented

### JWT Authentication
- JWT Strategy returns `role` in payload (fixed: was `undefined`)
- API Gateway validates token and passes `req.user.role` to controllers
- All authorization uses `req.user.role` for role-based access control

### Event-Driven Communication
- KafkaJS producer/consumer pattern
- Topics: `user.registered`, `user.login`, `event.created`, etc.
- Notifications service consumes events and sends emails via MailHog

### Database (Drizzle ORM)
- Schema: `users`, `events`, `tickets` tables
- `events.price` and `tickets.totalPrice` use `numeric(10,2)` for decimals
- Migration-ready with drizzle-kit

### Rate Limiting
- Throttler globally configured (10 requests per 60 seconds)
- Redis-backed storage available (ThrottlerStorageRedis class)

### Email Service
- MailHog for development (no SMTP credentials needed)
- Welcome emails on user registration
- Ticket confirmation/cancellation emails on Kafka events

## Port Configuration

| Service | Host Port | Container Port | Description |
|---------|-----------|----------------|-------------|
| API Gateway | 3000 | 3000 | Main entry point |
| Auth Service | 3001 | 3001 | Authentication |
| Events Service | 3003 | 3003 | Event management |
| Tickets Service | 3004 | 3004 | Ticket management |
| Notifications | 3006 | 3006 | Kafka consumer + email |
| PostgreSQL | 5432 | 5432 | Database |
| Redis | 6379 | 6379 | Caching |
| Kafka | 9094 | 9094 | External broker |
| Mailhog SMTP | 1025 | 1025 | Email server |
| Mailhog UI | 8025 | 8025 | Email web interface |

## Troubleshooting

### Kafka Connection Issues
- Ensure Kafka broker is reachable: `nc -zv localhost 9094`
- Topics must exist: `docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9094`
- Use `localhost:9094` for host connections (internal: `kafka:9092`)

### Database Connection Issues
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check connection string matches `.env`: `postgres://postgres:password@localhost:5432/eventflow`
- Ensure schema is pushed: `pnpm db:push`

### Authentication Issues
- Ensure JWT_SECRET is consistent across all services
- Verify `KAFKA_BROKER=localhost:9094` is set for local development
- Check `role` is included in JWT payload (fixed in jwt.strategy.ts)

## Cleanup

### Stop Everything

```bash
# Stop docker containers and remove volumes
docker compose down --volumes

# Kill any remaining node processes
pkill -f "node dist/apps" 2>/dev/null || true

# Prune docker system (optional)
docker system prune -af --volumes
```

### Git Upload Preparation

The project is ready to upload. All sensitive data (JWT_SECRET, DB passwords) should be set in `.env` and NOT committed to git. The `.dockerignore` file controls what's excluded from Docker builds.

## Git Upload Instructions

```bash
# Initialize git repo
git init

# Add all files
git add .

# Create initial commit
git commit -m "EventFlow NestJS Microservices - v12 with rspack, Drizzle, Kafka"

# Add remote (replace with your repo)
git remote add origin git@github.com:sawmikcuet19/nestjs-microservices.git

# Push to main branch
git push -u origin main
```