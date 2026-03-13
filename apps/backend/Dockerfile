# Stage 1: Prune workspace to only what backend needs
FROM node:24-alpine AS pruner
RUN npm install -g turbo
WORKDIR /app
COPY . .
RUN turbo prune @helilog/backend --docker

# Stage 2: Install dependencies (cached layer — only reruns when lockfile changes)
FROM node:24-alpine AS installer
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM installer AS builder
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @helilog/backend db:generate
RUN pnpm turbo build --filter=@helilog/backend

# Stage 4: Production image
FROM node:24-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

WORKDIR /app/apps/backend

RUN pnpm db:generate

EXPOSE 3000
ENV NODE_ENV=production

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/index.js"]
