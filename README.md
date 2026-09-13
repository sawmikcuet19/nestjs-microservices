# EventFlow - NestJS Microservices Architecture

## Project Overview

EventFlow is a complete NestJS v12 microservices application demonstrating event-driven architecture with:
- **5 microservices** API Gateway, Auth, Events, Tickets, Notifications
- **3 shared libraries** common, database, kafka
- **PostgreSQL** for data persistence
- **Kafka** for event-driven communication (KRaft mode)
- **Redis** for caching and rate limiting
- **MailHog** for email testing

## Architecture Overview

```mermaid
flowchart LR
    Client["Client"] --> GW["API Gateway"]
    GW --> Auth["Auth Service"]
    GW --> Events["Events Service"]
    GW --> Tickets["Tickets Service"]
    Auth --> DB["PostgreSQL"]
    Events --> DB
    Tickets --> DB
    Auth --> Kafka["Kafka"]
    Events --> Kafka
    Tickets --> Kafka
    Kafka --> Notify["Notifications Service"]
    Notify --> Email["MailHog SMTP"]
```

## Flow 1 - User Registration

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant Auth as Auth Service
    participant DB as PostgreSQL
    participant Kafka as Kafka
    participant Notify as Notifications
    participant SMTP as MailHog

    C->>GW: POST /auth/register
    GW->>Auth: Forward request
    Auth->>DB: INSERT user
    DB-->>Auth: User created
    Auth->>Kafka: Emit user.registered
    Auth-->>GW: Return JWT + user
    GW-->>C: 201 Created
    Kafka->>Notify: Consume user.registered
    Notify->>SMTP: Send welcome email
    SMTP-->>Notify: Email sent
```

## Flow 2 - User Login

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant Auth as Auth Service
    participant DB as PostgreSQL

    C->>GW: POST /auth/login
    GW->>Auth: Forward request
    Auth->>DB: SELECT user by email
    DB-->>Auth: User record
    Auth->>Auth: Verify password with bcrypt
    Auth->>Auth: Sign JWT with role
    Auth-->>GW: Return access_token + user
    GW-->>C: 200 OK
```

## Flow 3 - Create and Publish Event

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant Events as Events Service
    participant DB as PostgreSQL
    participant Kafka as Kafka

    Note over C,Kafka: Create Event
    C->>GW: POST /events (with JWT)
    GW->>GW: Validate JWT, extract role
    GW->>Events: Forward with x-user-id header
    Events->>DB: INSERT event
    DB-->>Event: Event created
    Events->>Kafka: Emit event.created
    Events-->>GW: Return event
    GW-->>C: 201 Created

    Note over C,Kafka: Publish Event
    C->>GW: POST /events/:id/publish (with JWT)
    GW->>Events: Forward with x-user-id, x-user-role
    Events->>DB: UPDATE event SET status='PUBLISHED'
    Events-->>GW: Return updated event
    GW-->>C: 200 OK
```

## Flow 4 - Purchase Ticket

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant Tickets as Tickets Service
    participant DB as PostgreSQL
    participant Kafka as Kafka
    participant Notify as Notifications
    participant SMTP as MailHog

    C->>GW: POST /tickets/purchase (with JWT)
    GW->>Tickets: Forward request
    Tickets->>DB: SELECT event (check capacity)
    DB-->>Tickets: Event data
    Tickets->>Tickets: Check sold vs capacity
    Tickets->>DB: INSERT ticket
    DB-->>Tickets: Ticket created
    Tickets->>Kafka: Emit ticket.purchased
    Tickets-->>GW: Return ticket
    GW-->>C: 201 Created
    Kafka->>Notify: Consume ticket.purchased
    Notify->>DB: SELECT user email by userId
    Notify->>SMTP: Send confirmation email
```

## Flow 5 - Kafka Event-Driven Notifications

```mermaid
flowchart LR
    subgraph Producers
        A["Auth Service"] -->|"user.registered"| K["Kafka"]
        B["Events Service"] -->|"event.created"| K
        C["Tickets Service"] -->|"ticket.purchased"| K
        D["Tickets Service"] -->|"ticket.cancelled"| K
    end

    subgraph Consumers
        K --> N["Notifications Service"]
    end

    subgraph Actions
        N -->|"user.registered"| W["Welcome Email"]
        N -->|"ticket.purchased"| TC["Ticket Confirmation"]
        N -->|"ticket.cancelled"| TX["Ticket Cancellation"]
    end

    style Producers fill:#e1f5fe,stroke:#0288d1
    style Consumers fill:#f3e5f5,stroke:#7b1fa2
    style Actions fill:#e8f5e9,stroke:#388e3c
```

## Database Schema

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar password
        varchar name
        varchar role
        timestamp created_at
        timestamp updated_at
    }
    EVENTS {
        uuid id PK
        varchar title
        text description
        timestamp date
        varchar location
        integer capacity
        numeric price
        varchar status
        uuid organizer_id FK
        timestamp created_at
        timestamp updated_at
    }
    TICKETS {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        integer quantity
        numeric total_price
        varchar status
        varchar ticket_code UK
        timestamp purchased_at
        timestamp checked_in_at
        timestamp created_at
    }

    USERS ||--o{ EVENTS : "organizes"
    USERS ||--o{ TICKETS : "purchases"
    EVENTS ||--o{ TICKETS : "has"
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