# Stage 1: Prune workspace to only what frontend needs
FROM node:24-alpine AS pruner
RUN npm install -g turbo
WORKDIR /app
COPY . .
RUN turbo prune @helilog/frontend --docker

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
RUN pnpm turbo build --filter=@helilog/frontend

# Stage 4: Production image — serve static files with nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
