# Niche CRM — Agency OS

A full-stack, production-ready CRM built for agencies. Manage clients, deals, projects, tasks, finances, HR, marketing campaigns, and more — all in one dark-themed, animated dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | NestJS, Prisma ORM, JWT Auth, REST API |
| Database | SQLite (file-based, zero-config — perfect for handover) |
| Auth | JWT with bcrypt password hashing |

---

## Features

### 12 Core Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Live KPI overview, revenue chart, pipeline snapshot |
| **Sales CRM** | Contacts, companies, pipeline stages, drag-drop deals |
| **Marketing** | Campaigns (Email/SMS/Social), lead scoring, funnel analytics |
| **Finance** | Invoices, line items, billing overview, MRR/ARR tracking |
| **Projects** | Project cards, sprint boards, status tracking |
| **Task Board** | Kanban + list view, priorities, assignees, time entries |
| **Resources** | Team workload distribution, capacity forecasting, auto-balance |
| **Client Success** | Support tickets, NPS sentiment, renewal health, upsell scoring |
| **Operations** | Employee registry, attendance, payroll, contracts, hiring kanban |
| **Partners** | Partner management, commission tracking, payout approvals |
| **Knowledge Base** | Sales scripts, playbooks, SOPs, templates with CRUD |
| **AI Automation** | Agent chat interface, workflow automation triggers |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### 1. Clone the repo

```bash
git clone https://github.com/anildemo3-bot/CRM.git
cd CRM
```

### 2. Backend setup

```bash
cd backend
npm install

# Copy env file and fill in values (JWT_SECRET at minimum)
cp .env.example .env

# Run database migrations and seed demo data
npx prisma migrate dev --name init
npx prisma db seed

# Start the server (runs on port 3010)
npm run start:dev
```

### 3. Frontend setup

```bash
cd ../frontend
npm install

# Start the dev server (runs on port 3000)
npm run dev
```

### 4. Open the app

Go to **http://localhost:3000**

### Demo credentials

```
Email:    nic@niche.com
Password: niche123
```

---

## Project Structure

```
CRM/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (SQLite)
│   │   ├── seed.ts             # Demo seed data
│   │   └── migrations/         # Migration history
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # JWT login/register
│   │   │   ├── crm/            # Contacts, companies, deals, pipelines
│   │   │   ├── projects/       # Projects, tasks, sprints
│   │   │   ├── finance/        # Invoices, time entries
│   │   │   ├── operations/     # Employees, attendance, payroll
│   │   │   ├── marketing/      # Campaigns, leads
│   │   │   ├── clients/        # Tickets, support
│   │   │   ├── analytics/      # Revenue aggregation
│   │   │   ├── knowledge/      # Scripts, playbooks, templates (in-memory)
│   │   │   └── partners/       # Partners, payouts (in-memory)
│   │   └── app.module.ts
│   └── .env.example
│
└── frontend/
    └── src/
        ├── app/
        │   ├── login/
        │   ├── register/
        │   └── dashboard/
        │       ├── page.tsx            # Overview
        │       ├── crm/
        │       ├── marketing/
        │       ├── finance/
        │       ├── projects/
        │       ├── tasks/
        │       ├── resources/
        │       ├── clients/
        │       ├── operations/
        │       ├── partners/
        │       ├── knowledge/
        │       ├── ai/
        │       ├── analytics/
        │       ├── intelligence/
        │       └── expansion/
        ├── components/
        │   ├── Sidebar.tsx
        │   └── Toast.tsx
        └── lib/
            ├── api.ts              # Axios instance
            ├── endpoints.ts        # All API endpoint helpers
            └── store.ts            # Zustand auth store
```

---

## API Overview

All endpoints require a `Bearer <JWT>` header (except login/register).

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | Login → returns JWT |
| `POST /auth/register` | Register new org + admin user |
| `GET/POST /crm/contacts` | CRM contacts |
| `GET/POST /crm/deals` | Deals pipeline |
| `GET/POST /projects` | Projects |
| `GET/POST /projects/tasks` | Tasks |
| `GET/POST /finance/invoices` | Invoices |
| `GET/POST /operations/employees` | HR employees |
| `GET/POST /marketing/campaigns` | Campaigns |
| `GET/POST /clients/tickets` | Support tickets |
| `GET /analytics/overview` | Dashboard KPIs |
| `GET/POST /knowledge/scripts` | Sales scripts |
| `GET/POST /partners` | Partner registry |
| `GET/POST /partners/payouts` | Payout management |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path — default: `file:./dev.db` |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `PORT` | Backend port (default: `3010`) |
| `STRIPE_SECRET_KEY` | Optional — for Stripe billing |
| `OPENAI_API_KEY` | Optional — for AI features |

---

## Database

This project uses **SQLite** — a single file database (`backend/prisma/dev.db`).

- No server setup needed
- No credentials to share
- Easily portable — just copy the `.db` file
- To reset: delete `dev.db`, then run `npx prisma migrate dev`

---

## Handover Checklist

- [ ] Install Node.js 18+
- [ ] `cd backend && npm install`
- [ ] Copy `.env.example` → `.env`, set a strong `JWT_SECRET`
- [ ] `npx prisma migrate dev --name init`
- [ ] `npx prisma db seed`
- [ ] `npm run start:dev`
- [ ] `cd ../frontend && npm install && npm run dev`
- [ ] Open http://localhost:3000 — log in with `nic@niche.com / niche123`

---

## License

MIT
