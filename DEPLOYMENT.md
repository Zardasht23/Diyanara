# Diyanara — Production Deployment Guide

This document covers deploying Diyanara to a VPS using Docker Compose, following the standard project layout:

```
/opt/projects/diyanara/
├── app/          ← Git repository (source, Dockerfiles, docker-compose.yml)
├── data/         ← Persistent storage (survives container recreation)
│   ├── postgres/ ← PostgreSQL data files
│   └── labels/   ← PostNord shipping label PDFs
└── backups/      ← Backup archives (created by your backup script)
```

---

## Table of contents

1. [Initial installation](#1-initial-installation)
2. [Environment variables](#2-environment-variables)
3. [Docker deployment](#3-docker-deployment)
4. [Updating the application](#4-updating-the-application)
5. [Database migrations](#5-database-migrations)
6. [Backups](#6-backups)
7. [Database restore](#7-database-restore)
8. [Stripe setup](#8-stripe-setup)
9. [PostNord setup](#9-postnord-setup)
10. [Nginx reverse proxy](#10-nginx-reverse-proxy)
11. [Local development](#11-local-development)

---

## 1. Initial installation

### Prerequisites

- Ubuntu/Debian VPS with Docker and Docker Compose v2 installed
- Git
- A domain pointed at your server (via Cloudflare recommended)
- Host Nginx configured for SSL termination

### Steps

```bash
# Create the standard directory layout
sudo mkdir -p /opt/projects/diyanara/{app,data,backups}
sudo chown -R $USER:$USER /opt/projects/diyanara

# Clone the repository
git clone <your-repo-url> /opt/projects/diyanara/app
cd /opt/projects/diyanara/app

# Create persistent data directories
mkdir -p /opt/projects/diyanara/data/{postgres,labels,uploads}

# Backend container runs as uid 1000 (node user) — data must be writable
sudo chown -R 1000:1000 /opt/projects/diyanara/data

# Configure environment
cp .env.example .env
nano .env   # fill in all required values (see section 2)

# First deploy (with database seed)
# Set RUN_SEED=true and a strong ADMIN_PASSWORD in .env before this step
docker compose up -d --build

# After first successful deploy, set RUN_SEED=false in .env and redeploy:
# docker compose up -d
```

The application will be available at `http://127.0.0.1:3010` on the host. Configure Nginx (section 10) to expose it publicly over HTTPS.

---

## 2. Environment variables

Copy `.env.example` to `.env` in the `app/` directory. Every variable is documented in that file.

### Required for production

| Variable | Description |
| -------- | ----------- |
| `POSTGRES_PASSWORD` | Strong password for PostgreSQL |
| `JWT_SECRET` | Long random string (`openssl rand -base64 48`) |
| `FRONTEND_URL` | Public shop URL, e.g. `https://diyanara.example.com` |
| `BACKEND_URL` | Public API URL (same as frontend when using built-in nginx proxy) |
| `CORS_ORIGIN` | Allowed browser origin(s), comma-separated |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `POSTNORD_API_KEY` | PostNord Booking API key (or `postnord_xxx` for mock mode) |
| `ALLOW_MOCK_PAYMENTS` | Set `true` only on staging to allow mock Stripe without real keys |
| `TRUST_PROXY_HOPS` | Number of reverse proxies (default `2` for Cloudflare + Nginx) |

### Email (prepared, not yet implemented)

| Variable | Description |
| -------- | ----------- |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (typically 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM` | Sender address, e.g. `Diyanara <noreply@example.com>` |

### Storage

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `DATA_PATH` | `../data` | Path to persistent data (relative to `docker-compose.yml`) |

Inside the backend container, `DATA_DIR=/data` and `LABELS_DIR=/data/labels` are set automatically. Labels and future uploads are stored under `/opt/projects/diyanara/data/` on the host.

### Container memory limits

Each service has memory limits to prevent Diyanara from starving other projects on a shared VPS. Defaults are suitable for a small shop on a 2–4 GB VPS:

| Variable | Default | Service |
| -------- | ------- | ------- |
| `POSTGRES_MEMORY_LIMIT` | `512M` | PostgreSQL hard cap |
| `POSTGRES_MEMORY_RESERVATION` | `256M` | PostgreSQL soft reservation |
| `BACKEND_MEMORY_LIMIT` | `512M` | NestJS API hard cap |
| `BACKEND_MEMORY_RESERVATION` | `128M` | NestJS API soft reservation |
| `FRONTEND_MEMORY_LIMIT` | `128M` | Nginx hard cap |
| `FRONTEND_MEMORY_RESERVATION` | `64M` | Nginx soft reservation |

On an 8 GB+ VPS where Diyanara is the main workload, consider raising Postgres to `1G` and backend to `768M`.

Verify limits after deploy:

```bash
docker stats diyanara-postgres diyanara-backend diyanara-frontend
```

If a container hits its limit repeatedly (OOM restarts in `docker compose ps`), increase the corresponding variable in `.env` and redeploy.

> Requires Docker Compose v2.23+ for `deploy.resources` limits with `docker compose up`. Postgres is tuned for small containers (`shared_buffers=128MB`).

---

## 3. Docker deployment

### Services

| Service | Access | Port | Description |
| ------- | ------ | ---- | ----------- |
| `frontend` | `127.0.0.1:3010` | 80 (internal) | Nginx serving React SPA + API proxy |
| `backend` | Internal network only | 3001 | NestJS API |
| `postgres` | Internal network only | — | PostgreSQL 16 (not exposed on production compose) |

### Startup order

1. **PostgreSQL** starts and passes its health check (`pg_isready`)
2. **Backend** runs `prisma migrate deploy`, then starts the API
3. **Frontend** starts after the backend health check passes

### Deploy command

```bash
cd /opt/projects/diyanara/app
git pull
docker compose up -d --build
```

### Verify deployment

```bash
docker compose ps
docker compose logs -f backend
curl -f http://127.0.0.1:3010/health
```

---

## 4. Updating the application

```bash
cd /opt/projects/diyanara/app
git pull
docker compose up -d --build
```

Database migrations run automatically on backend startup. No manual steps are required for routine updates.

To view logs:

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 5. Database migrations

Migrations are applied automatically when the backend container starts (`prisma migrate deploy` in the entrypoint).

To run migrations manually:

```bash
docker compose exec backend node node_modules/prisma/build/index.js migrate deploy
```

To seed the database (first deploy or after reset):

```bash
# Option A: set RUN_SEED=true in .env and restart backend
docker compose up -d backend

# Option B: run seed manually
docker compose exec backend node_modules/.bin/prisma db seed
```

Default admin credentials (change before seeding):

- Email: value of `ADMIN_EMAIL` (default `admin@diyanara.test`)
- Password: value of `ADMIN_PASSWORD`

---

## 6. Backups

All persistent data lives under `/opt/projects/diyanara/data/`. A generic backup script can archive this directory:

```bash
#!/bin/bash
BACKUP_DIR="/opt/projects/diyanara/backups"
DATA_DIR="/opt/projects/diyanara/data"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE="$BACKUP_DIR/diyanara_data_$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"
tar -czf "$ARCHIVE" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"
echo "Backup created: $ARCHIVE"
```

### What is backed up

| Path | Contents |
| ---- | -------- |
| `data/postgres/` | Full PostgreSQL data directory |
| `data/labels/` | PostNord shipping label PDFs |
| `data/uploads/` | Reserved for future product image uploads |

> **Note:** Product images are currently stored as external URLs in the database, not on disk. A full restore requires the `data/` backup (which includes Postgres). External image URLs are not covered by file backup.

### Recommended schedule

- Daily automated backups of `/opt/projects/diyanara/data/`
- Retain at least 7 daily and 4 weekly backups

---

## 7. Database restore

```bash
# Stop the application
cd /opt/projects/diyanara/app
docker compose down

# Restore data directory from backup
tar -xzf /opt/projects/diyanara/backups/diyanara_data_YYYYMMDD_HHMMSS.tar.gz \
  -C /opt/projects/diyanara/

# Start the application
docker compose up -d
```

If restoring only the database to a fresh Postgres volume:

```bash
docker compose down
rm -rf /opt/projects/diyanara/data/postgres/*
tar -xzf /opt/projects/diyanara/backups/diyanara_data_YYYYMMDD_HHMMSS.tar.gz \
  -C /opt/projects/diyanara/ --strip-components=0 data/postgres
docker compose up -d
```

---

## 8. Stripe setup

### Test mode (development/staging)

1. Get test keys from [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys)
2. Set in `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Register webhook endpoint: `https://your-domain.com/stripe/webhook`
4. Subscribe to event: `checkout.session.completed`

### Production mode

Switch to live keys — no code changes required:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Update the webhook URL in the Stripe Dashboard to your production domain.

### Mock mode

Leave `STRIPE_SECRET_KEY=sk_test_xxx` to enable mock checkout (orders marked paid immediately, no Stripe call). Useful for staging without real payments.

---

## 9. PostNord setup

### Mock mode (default)

Leave `POSTNORD_API_KEY=postnord_xxx`. The system generates printable PDF labels with mock tracking numbers.

Labels are stored at `/opt/projects/diyanara/data/labels/` and survive container recreation.

### Production mode

1. Sign a PostNord Business contract and obtain a Booking API key from the [PostNord Developer Portal](https://portal.postnord.com/se/en/resources/integrations/api/booking-api/)
2. Set in `.env`:
   ```
   POSTNORD_API_KEY=your-real-api-key
   ```
3. Configure sender address fields (`SENDER_NAME`, `SENDER_ADDRESS`, etc.) — these are printed on every label
4. Optionally override `POSTNORD_SERVICE_CODE` (default `17` = MyPack Home DK)

---

## 10. Nginx reverse proxy

The frontend container listens on `127.0.0.1:3010` and proxies API requests to the internal backend. Host Nginx only needs to forward traffic to the frontend.

Example host Nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name diyanara.example.com;

    # SSL certificates (managed by certbot or Cloudflare origin cert)
    ssl_certificate     /etc/letsencrypt/live/diyanara.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/diyanara.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10m;
    }
}
```

The backend trusts `X-Forwarded-For` and `X-Forwarded-Proto` headers (`trust proxy` is enabled).

Stripe webhooks reach the backend via the frontend nginx proxy at `/stripe/webhook`.

---

## 11. Local development

For local development without Docker for the apps:

```bash
# Start only PostgreSQL (with localhost port via dev override)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres

# Backend
cd backend
cp env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev

# Frontend (separate terminal)
cd frontend
cp env.example .env
npm install
npm run dev
```

- Shop: `http://localhost:5173`
- API: `http://localhost:3001`

See [README.md](README.md) for the full local development guide.

---

## 12. Troubleshooting

### Backend container exits immediately

Check logs:

```bash
docker compose logs backend
```

Common causes:

| Error | Fix |
| ----- | --- |
| `Can't write to .../@prisma/engines` | Rebuild with latest Dockerfile (`docker compose build --no-cache backend`). Engines must be bundled at build time and owned by the `node` user (uid 1000). |
| `JWT_SECRET must be set` | Set a strong `JWT_SECRET` in `.env` |
| `CORS_ORIGIN must be set` | Set `CORS_ORIGIN` to your public domain |
| `FRONTEND_URL must be set` | Set `FRONTEND_URL` to your public domain |
| `STRIPE_SECRET_KEY must be configured` | Add real Stripe keys, or set `ALLOW_MOCK_PAYMENTS=true` for staging |
| Migration failed | Check Postgres is healthy: `docker compose ps` |

### Permission denied writing to `/data`

The backend runs as uid `1000`. Fix ownership:

```bash
sudo chown -R 1000:1000 /opt/projects/diyanara/data
docker compose up -d backend
```

### Frontend loads but API calls fail

1. Verify backend health: `docker compose exec backend curl -f http://localhost:3001/health`
2. Verify proxy: `curl -f http://127.0.0.1:3010/health`
3. Check `CORS_ORIGIN` matches your public domain exactly (including `https://`)

### Stripe webhooks not received

1. Webhook URL must be `https://your-domain.com/stripe/webhook`
2. Verify `STRIPE_WEBHOOK_SECRET` matches the endpoint in Stripe Dashboard
3. Check Cloudflare is not blocking POST requests to `/stripe/webhook`

### Labels not generating

1. Check backend logs for PostNord errors
2. Verify labels directory exists and is writable: `ls -la /opt/projects/diyanara/data/labels/`
3. In mock mode, labels are still created as PDFs with mock tracking numbers

### Container keeps restarting (OOM)

A service may be hitting its memory limit:

```bash
docker stats --no-stream
docker compose logs backend   # or postgres / frontend
```

Increase the relevant `*_MEMORY_LIMIT` in `.env` and run `docker compose up -d`.

### Database connection refused (local dev)

Use the dev compose override to expose Postgres on localhost:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
```

Ensure `DATABASE_URL` in `backend/.env` points to `localhost:5432`.
