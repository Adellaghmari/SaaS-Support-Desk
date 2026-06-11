# SaaS Support Desk

A fullstack support and customer success workspace for managing customers, tickets, onboarding and technical support workflows.

**Live demo:** https://saas-support-desk.vercel.app  
**GitHub:** https://github.com/Adellaghmari/SaaS-Support-Desk

## Overview

SaaS Support Desk is a portfolio project built to show how a support and customer success team can work in one place. It covers customer accounts, ticket handling, onboarding visibility, health signals, and internal documentation.

The goal is practical: show fullstack skills, realistic support workflows, and product thinking around retention and account health.

## What you can do

- Review support workload and customer health on the dashboard
- Browse customers with health scores, plans, status and support history
- Open customer details with notes, onboarding status and recommended actions
- Manage tickets with priority, status, category and internal notes
- Track onboarding progress and overdue tasks
- Use the knowledge base for internal support documentation
- Understand customer risk through health scores and support signals

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, React Router |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Validation | Zod |
| API | REST |
| Deployment | Vercel, Render, Neon |

## How the workflow fits together

Customers create tickets. Tickets have priority, category, status and comments.

Customer health is affected by tickets, onboarding and account state. Support Focus cards show what the team should act on today. Onboarding shows setup progress and overdue tasks. The knowledge base supports internal troubleshooting.

## Customer health logic

Health scores reflect ticket load, ticket priority, onboarding progress and customer status. Accounts with open urgent tickets, slow onboarding or at risk status score lower. Healthy active accounts with resolved tickets and strong onboarding progress score higher.

## Support workflow

Start on the dashboard to see priorities and workload. Open a customer to review health, notes, tickets and onboarding. Drill into a ticket for comments and status updates. Use Onboarding to track setup tasks and overdue work. Use the Knowledge Base when you need internal troubleshooting guides.

## Local setup

**Backend**

```bash
cd backend
npm install
npm run dev
```

Runs at `http://localhost:3001`

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`

If `DATABASE_URL` is not set, the backend uses in memory demo data and seeds on start. No PostgreSQL required for a quick local run.

### Full PostgreSQL mode

```bash
cd backend
cp .env.example .env
```

Set `DATABASE_URL` in `.env`, then:

```bash
npm run db:setup
npm run db:seed
npm run dev
```

## Environment variables

**Backend**

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default `3001`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_URL` | Allowed frontend origin for CORS |
| `NODE_ENV` | `development` or `production` |
| `USE_MEMORY_DB` | Force in memory database for local demo |

**Frontend**

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API URL |

## API endpoints

| Method | Path |
|--------|------|
| GET | `/api/health`, `/api/dashboard` |
| GET, POST | `/api/customers`, `/api/tickets`, `/api/articles` |
| GET | `/api/customers/:id`, `/api/tickets/:id`, `/api/tickets/:id/comments`, `/api/onboarding` |
| PUT | `/api/customers/:id`, `/api/tickets/:id`, `/api/onboarding/:taskId` |
| POST | `/api/customers/:id/notes`, `/api/tickets/:id/comments` |

## Recruiter walkthrough

1. Open the dashboard and review Support Focus Today
2. Open Customers and review a customer with a low health score
3. Open a customer detail page and check notes, tickets and onboarding
4. Open Tickets and inspect priority, status and category filters
5. Open a ticket detail page and review comments and internal notes
6. Open Onboarding and check overdue setup tasks
7. Open Knowledge Base and search for a support article

## Demo data

- 12 customers
- 30 tickets
- 55+ comments
- Onboarding tasks for 6 customers
- 11 knowledge base articles
