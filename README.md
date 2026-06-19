# Order Platform Auth Service

NestJS authentication and authorization service using PostgreSQL, Prisma,
Redis sessions, Argon2id passwords and rotating JWT refresh tokens.

## Local setup

```powershell
copy .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

The service listens on `http://localhost:3001`, Swagger is available at
`http://localhost:3001/docs`, and API routes use the `/api/v1` prefix.

For local database tools such as DBeaver, connect to PostgreSQL at
`127.0.0.1:15432`, database `order-platform`, schema `auth`.

The default seed account is configured with `ADMIN_EMAIL` and
`ADMIN_PASSWORD`. Change these values outside local development.

## Authentication flow

1. Login returns a 15-minute access token and seven-day refresh token.
2. Refreshing rotates both tokens and invalidates the previous refresh token.
3. Logout deletes the Redis session, immediately invalidating its access token.

## Commands

```powershell
npm run lint
npm test
npm run test:e2e
npm run build
```
