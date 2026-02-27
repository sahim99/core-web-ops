# CoreWebOps

> **The Operational Command Center for Growing Teams**
>
> Replaces: CRM · Bookings · Inbox · Forms · Inventory · Alerts · Automation · Reporting — all in one workspace.

[![Live Demo](https://img.shields.io/badge/Live-Demo-6366f1?style=for-the-badge)](https://corewebops.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org)

---

## Screenshots

### Landing Page
![CoreWebOps Landing Page](docs/screenshots/landing.png)

### Dashboard — Command Center
![CoreWebOps Dashboard](docs/screenshots/dashboard.png)

---

## Overview

**CoreWebOps** is a full-stack SaaS platform built for small and mid-sized service businesses that are tired of juggling multiple disconnected tools. It provides a single, structured workspace for managing every part of operations — from first contact to completed booking.

### Core Modules

| Module | What it does |
|---|---|
| **CRM** | Manage contacts — customers, vendors, providers — with source tracking |
| **Bookings** | Create and track bookings across status lifecycle (pending → confirmed → completed) |
| **Inbox** | Multi-channel conversation threads (SMS, Email, Web) with unread tracking |
| **Forms** | Build and publish intake, inquiry, and feedback forms with a public URL |
| **Inventory** | Track stock levels, set reorder thresholds, get low-stock alerts |
| **Alerts** | Real-time system notifications with severity levels (info / warning / critical) |
| **Automation Engine** | Event-driven rule pipeline — auto-emails, SMS, thread creation, retry logic |
| **Dashboard** | Live KPI cards, revenue chart, booking distribution, conversion funnel |

---

## Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        B[React 19 + Vite]
        B --> |Axios + httpOnly cookie| API
    end

    subgraph API["Backend — FastAPI"]
        direction TB
        AUTH[Auth Router\n/auth]
        CRM_R[CRM Router\n/contacts]
        BOOK_R[Bookings Router\n/bookings]
        INBOX_R[Inbox Router\n/conversations]
        FORM_R[Forms Router\n/forms]
        INV_R[Inventory Router\n/inventory]
        AUTO_R[Automation Router\n/automation]
        ALERT_R[Alerts Router\n/alerts]
    end

    subgraph Services["Service Layer"]
        SEED[Demo Seeder]
        DISPATCH[Event Dispatcher]
        AUTO_ENG[Automation Engine]
        EMAIL[Email Provider\nSMTP / Mock]
        SMS[SMS Provider\nTwilio / Mock]
    end

    subgraph DB["Data Layer — PostgreSQL"]
        USERS[(users)]
        CONTACTS[(contacts)]
        BOOKINGS[(bookings)]
        CONVOS[(conversations)]
        MSGS[(messages)]
        FORMS[(forms)]
        INV[(inventory_items)]
        ALERTS[(alerts)]
        EVENTS[(event_logs)]
        AUTO_LOGS[(automation_logs)]
    end

    B --> AUTH
    B --> CRM_R
    B --> BOOK_R
    B --> INBOX_R
    B --> FORM_R
    B --> INV_R
    B --> AUTO_R
    B --> ALERT_R

    AUTH --> SEED
    BOOK_R --> DISPATCH
    FORM_R --> DISPATCH
    DISPATCH --> AUTO_ENG
    AUTO_ENG --> EMAIL
    AUTO_ENG --> SMS
    AUTO_ENG --> EVENTS

    AUTH --> USERS
    CRM_R --> CONTACTS
    BOOK_R --> BOOKINGS
    INBOX_R --> CONVOS
    INBOX_R --> MSGS
    FORM_R --> FORMS
    INV_R --> INV
    ALERT_R --> ALERTS
    AUTO_R --> EVENTS
    AUTO_R --> AUTO_LOGS
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS, React Router v6, Axios, Framer Motion |
| **Backend** | FastAPI, SQLAlchemy, Alembic, Pydantic v2 |
| **Database** | PostgreSQL 15 (Supabase) |
| **Auth** | JWT (python-jose) · bcrypt · httpOnly Cookies · CSRF double-submit |
| **Deployment** | GCP Cloud Run (Docker) via Cloud Build CI/CD |
| **Notifications** | SMTP Email · Twilio SMS (mock providers included) |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15 (or a [Supabase](https://supabase.com) project)

### 1. Clone & configure

```bash
# Backend env
cp backend/.env.example backend/.env
# → Set DATABASE_URL, SECRET_KEY, CORS_ORIGINS

# Frontend env
cp frontend/.env.example frontend/.env
# → Set VITE_API_URL=http://localhost:8000
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open

| URL | What |
|---|---|
| http://localhost:5173 | Frontend |
| http://localhost:5173 → **Live Demo** | Demo account (pre-seeded data) |
| http://localhost:8000/docs | Swagger API docs |
| http://localhost:8000/health | Health check |

---

## Docker (Full Stack)

```bash
docker-compose up --build
```

- Frontend → http://localhost:8080  
- Backend → http://localhost:8000

> `docker-compose.yml` spins up a local PostgreSQL container. In production, connect to Supabase/Cloud SQL via `DATABASE_URL`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT signing key — `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `ALGORITHM` | | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | Token TTL (default: `30`) |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed origins |
| `EMAIL_PROVIDER` | | `mock` or `smtp` |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | | SMTP credentials |
| `SMS_PROVIDER` | | `mock` or `twilio` |
| `TWILIO_SID` / `TWILIO_TOKEN` / `TWILIO_FROM` | | Twilio credentials |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend base URL (e.g. `http://localhost:8000`) |

---

## Security

| Feature | Implementation |
|---|---|
| **Authentication** | JWT in httpOnly cookies — not localStorage |
| **CSRF** | Double-submit cookie (`X-CSRF-Token` header) |
| **Passwords** | bcrypt with automatic salting |
| **Rate Limiting** | Per-endpoint middleware |
| **CORS** | Strict origin whitelist |
| **Input Validation** | Pydantic schemas on every endpoint |
| **RBAC** | Owner / Staff roles with per-module permissions |

---

## RBAC

| Role | Access |
|---|---|
| **Owner** | Full access — all modules, settings, team management |
| **Staff** | Scoped access — Inbox, Bookings, Forms, Inventory (per-module toggle) |

---

## Project Structure

```
Core Web Ops/
├── backend/
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── core/           # Config, DB, security, CSRF, rate limiting
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic, automation, seeder
│   │   └── utils/          # Enums, helpers
│   ├── alembic/            # Database migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API layer
│   │   ├── components/     # UI components
│   │   ├── context/        # Auth, Demo context
│   │   ├── pages/          # Page components
│   │   └── routes/         # Route definitions
│   └── Dockerfile
├── docs/screenshots/       # README assets
├── cloudbuild.yaml         # GCP CI/CD
├── docker-compose.yml
└── README.md
```

---

## GCP Deployment

The `cloudbuild.yaml` builds and deploys both services to Cloud Run automatically.

```bash
# Create secrets
gcloud secrets create DATABASE_URL --replication-policy="automatic"
gcloud secrets create SECRET_KEY   --replication-policy="automatic"
gcloud secrets create CORS_ORIGINS --replication-policy="automatic"
gcloud secrets create VITE_API_URL --replication-policy="automatic"

# Trigger deploy
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _REGION=us-central1,_REPO=corewebops
```

```bash
# Verify
curl https://YOUR_BACKEND_URL/health
# → { "status": "healthy", "database": "connected" }
```

---

## Production Checklist

- [ ] Generate a strong `SECRET_KEY` — never use the dev default
- [ ] Set `CORS_ORIGINS` to your production frontend URL only
- [ ] Configure real `EMAIL_PROVIDER=smtp` and `SMS_PROVIDER=twilio`
- [ ] All secrets via GCP Secret Manager — never in code or Docker images
- [ ] Health check: `GET /health` returns DB connectivity and workspace count

---

© 2026 Core Web Ops Inc. — Built for operators, by engineers.
