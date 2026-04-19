<<<<<<< HEAD
# Open_Green_Tech
# Open_Green_Tech
# Open_Green_Tech
=======
# Crop Advisor Platform

Production-ready full-stack SaaS platform for smart agriculture with:

- NestJS API + Prisma + PostgreSQL
- Next.js premium dashboard UI
- JWT authentication + RBAC (USER / ADMIN)
- Realtime telemetry and alerts through WebSocket
- AI-style agronomic recommendations
- AI chatbot assistant with contextual answers
- Full i18n support: French, English, Arabic (RTL)

## Monorepo structure

- `apps/backend`: NestJS API
- `apps/web`: Next.js app
- `packages/shared-types`: workspace package placeholder

## Core Features

1. Authentication
- Signup / login
- JWT secured API
- Role-based access control

2. Devices
- Add, list, update and delete devices
- Owner-based access for users
- Full visibility for admins

3. Telemetry
- Push telemetry values (temperature, humidity, light, anomaly)
- Get latest and history
- Realtime updates over Socket.IO

4. Alerts
- Automatic anomaly alerts with severity
- Acknowledge workflow

5. Recommendations
- Rule-based recommendations generated from latest telemetry
- Crop health, irrigation, fertilizer, and crop selection guidance

6. Admin control
- Global user listing
- Role management endpoint
- Global analytics views in dashboard

7. AI chatbot assistant
- Floating chat widget in the UI (web)
- Context-aware responses using devices, telemetry, alerts, recommendations
- LLM mode with OpenAI + resilient fallback mode
- Message history persisted per authenticated user

## API overview

Base URL: `http://localhost:3000/api`

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `GET /users` (ADMIN)
- `PATCH /users/:id/role` (ADMIN)
- `POST /devices`
- `GET /devices`
- `GET /devices/:id`
- `PATCH /devices/:id`
- `DELETE /devices/:id`
- `GET /telemetry/latest`
- `GET /telemetry/:deviceId`
- `POST /telemetry/:deviceId`
- `POST /recommendations/generate`
- `GET /recommendations/:deviceId`
- `GET /alerts`
- `PATCH /alerts/:id/ack`
- `POST /chat/message`
- `GET /chat/history`

## Local setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment files

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
```

### 3. Start PostgreSQL (Docker)

```bash
docker compose up -d db
```

### 4. Prepare Prisma

```bash
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:push
pnpm --filter backend prisma:seed
```

### 5. Run backend and frontend

```bash
pnpm --filter backend start:dev
pnpm --filter web dev
```

Frontend: `http://localhost:3001` (or Next default local URL)
Backend: `http://localhost:3000/api`

## Full Docker deployment

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
docker compose up --build
```

Services:

- Web app: `http://localhost:3001`
- API: `http://localhost:3000/api`
- PostgreSQL: `localhost:5432`

## Suggested demo flow (hackathon)

1. Register a user account.
2. Create one or more devices.
3. Push telemetry values to a device from API client or script.
4. Watch realtime dashboard chart updates.
5. Generate AI recommendations.
6. Trigger anomaly values to see alert pipeline.
7. Login as admin and inspect global control views.
8. Open the floating AI assistant and ask contextual farming questions.

## Demo quick start

Use the seeded credentials:

- Admin: `admin@agri.com` / `Admin@12345`
- User: `user@agri.com` / `Farmer@12345`

Run the live simulator in another terminal:

```bash
pnpm --filter backend demo:simulate
```

It posts telemetry every 2 seconds and generates anomaly bursts for a stronger demo effect.

Or start one-click demo mode from the admin UI with **Start Demo Mode**.

## Final 2-3 minute jury script

1. Login as admin (`admin@agri.com`).
2. Switch language: Arabic -> French -> English.
3. Click **Start Demo Mode** on the dashboard.
4. Show live chart updates and anomaly badges.
5. Open Recommendations and highlight:
	- AI confidence score
	- detected issues
	- explanation of why each recommendation exists
6. Open **Live Monitoring** page and show the real-time stream.
7. Open Admin dashboard and present:
	- total users/devices
	- anomalies summary chart
	- top problematic devices
	- recent activity stream

## Optional pro AI mode

Set `OPENAI_API_KEY` in `apps/backend/.env` to enable LLM-generated recommendations. If no key is present, the app falls back to deterministic agronomy rules.

## Security upgrades included

- Refresh tokens
- Rate limiting
- Strict DTO validation
- Structured logs with Pino

## Production notes

- Set strong `JWT_SECRET` in production.
- Use managed PostgreSQL and enforce backups.
- Restrict CORS origins to trusted domains.
- Add request throttling and audit logs for enterprise workloads.
>>>>>>> 860ec09 (Initial commit - Crop Advisor SaaS)
