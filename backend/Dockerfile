FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY backend ./backend

RUN npm ci

WORKDIR /app/backend
RUN npx prisma generate && npm run build

FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY backend/package*.json ./backend/

RUN npm ci --omit=dev

WORKDIR /app/backend

COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/prisma.config.ts ./prisma.config.ts

RUN npx prisma generate

EXPOSE 3000

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
