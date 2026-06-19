# Diyanara — Fine Jewelry Webshop

A modern, feminine e-commerce webshop for the jewelry brand **Diyanara**, built with:

- **Frontend:** React (Vite) + TypeScript + Tailwind CSS + shadcn-style UI
- **Backend:** NestJS + Prisma + PostgreSQL
- **Payments:** Stripe Checkout (with mock mode for local dev)
- **Shipping:** PostNord integration with auto-generated labels
- **Auth:** Email + password (JWT, bcrypt)

## Features

- Product catalog with category filtering and sorting
- Product detail pages with add-to-bag / buy-now
- Persistent shopping cart (prices in DKK)
- Checkout with Danish shipping address
- Customer accounts with order history and PostNord tracking
- Admin dashboard (products, orders, stock, labels)
- Stripe Checkout integration
- PostNord shipping labels (60 DKK / free over 250 DKK)

## Production deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full VPS deployment instructions.

Quick deploy on the server:

```bash
cd /opt/projects/diyanara/app
git pull
docker compose up -d --build
```

## Project structure

```
diyanara/
├── docker-compose.yml          # Production stack
├── docker-compose.dev.yml      # Local dev override (Postgres on localhost)
├── .env.example                # Production environment template
├── DEPLOYMENT.md           # Deployment guide
├── backend/                # NestJS API
│   ├── Dockerfile
│   ├── prisma/             # schema + migrations + seed
│   └── src/
└── frontend/               # React + Vite SPA
    ├── Dockerfile
    └── src/
```

## Local development

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### 1. Start PostgreSQL

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
```

Postgres runs on `127.0.0.1:5432` with database `diyanara`. The dev override file exposes the port on localhost only; production compose keeps Postgres on the internal network.

### 2. Backend

```bash
cd backend
cp env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

API: `http://localhost:3001`

Default admin: `admin@diyanara.test` / `admin123` (change via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` before seeding).

### 3. Frontend

```bash
cd frontend
cp env.example .env
npm install
npm run dev
```

Shop: `http://localhost:5173`

## Routes

| Route | Description |
| ----- | ----------- |
| `/` | Landing page |
| `/shop` | Catalog |
| `/product/:slug` | Product detail |
| `/cart` | Shopping bag |
| `/checkout` | Shipping + payment |
| `/account` | Customer account + orders |
| `/admin` | Admin dashboard |
| `/about` | About us |

## Scripts

### Backend

```bash
npm run start:dev       # watch mode
npm run prisma:migrate  # create / run migrations
npm run prisma:seed     # seed admin + sample products
npm run db:reset        # nuke DB and re-seed (destructive)
```

### Frontend

```bash
npm run dev      # Vite dev server
npm run build    # production build
npm run preview  # serve built bundle
```

---

Designed in code. Made with care.
