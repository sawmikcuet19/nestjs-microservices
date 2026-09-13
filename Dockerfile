# Dependency stage
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Build stage
FROM node:22-alpine AS builder

ARG SERVICE
ENV SERVICE=${SERVICE}

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build ${SERVICE}

# Production dependency stage
FROM node:22-alpine AS prod-deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

# Production stage
FROM node:22-alpine AS runner

ARG SERVICE
ENV SERVICE=${SERVICE}
ENV NODE_ENV=production

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD [ "sh", "-c", "node dist/apps/${SERVICE}/main.js" ]
