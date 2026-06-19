FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev \
    && npx prisma generate \
    && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
