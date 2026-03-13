FROM node:24-slim AS build

WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY frontend ./frontend

RUN npm ci

WORKDIR /app/frontend
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
