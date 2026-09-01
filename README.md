# 🏙️ Real Estate Management System

> **A Vibe Coding Project** — built end-to-end with an AI coding agent, from architecture to deployment.

A single-tenant real estate management platform built for property agencies to manage listings, clients, deal pipelines, transactions, and payments — with a clean, role-aware dashboard for owners, agents, and accountants.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://your-frontend-url.vercel.app)
[![Backend API](https://img.shields.io/badge/api-live-blue)](https://your-backend-url.example.com)
[![Built with Django](https://img.shields.io/badge/backend-Django%205.1-092E20?logo=django)](https://www.djangoproject.com/)
[![Built with Next.js](https://img.shields.io/badge/frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org/)

**🔗 Live Demo:** [your-frontend-url.vercel.app](https://your-frontend-url.vercel.app)
**🔗 Backend API:** [your-backend-url.example.com](https://your-backend-url.example.com)

---

## ✨ Overview

Most real estate agencies — especially in smaller cities — still run their business on registers, spreadsheets, and WhatsApp. This project replaces that with a real, production-grade system: property inventory, a client CRM, a deal pipeline with automated commission calculation, an installment payment ledger, and a live operations dashboard — all behind proper role-based access control.

It was built module by module with an AI coding agent, with every module verified through real automated tests and live API evidence before moving to the next — not just "should work" claims.

## 🧩 Features

| Module | Status | What it does |
|---|---|---|
| 🏠 **Properties** | ✅ Live | Full listing management — residential, commercial, plots, rentals — with images, amenities, status tracking, and rich filtering |
| 👥 **Clients** | ✅ Live | Mini-CRM for buyers, sellers, tenants, and landlords, with agent-scoped visibility |
| 🤝 **Deals** | ✅ Live | Deal pipeline linking clients to properties, with automatic property status sync, commission calculation, and installment plan terms |
| 💰 **Payments** | ✅ Live | Full installment ledger with auto-generated payment schedules, partial/overdue tracking, and printable receipts |
| 📊 **Dashboard** | ✅ Live | Real-time agency overview — revenue, active deals, overdue payments, inventory breakdown — scoped by role |
| 📈 **Reports** | 🔜 Planned | Historical trends, agent performance, and exportable reports |

## 🏗️ Architecture

Built as a **modular monolith** — clean domain separation without the overhead of microservices, with a clear path to split out high-traffic components later if the agency scales.

- **UUID primary keys** across all models — no sequential ID leakage of deal/transaction volume
- **Composite database indexes** matched to real query patterns (status + price, city + type, agent pipelines)
- **JWT authentication** with role-based access control (Admin, Agent, Accountant, Staff)
- **Supabase Storage** for all media/documents — zero binary data in Postgres
- **Global pagination** on every list endpoint to guarantee performance at scale

Full details in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5.1, Django REST Framework, SimpleJWT |
| Frontend | Next.js 15 (App Router, TypeScript, Tailwind CSS) |
| Database | PostgreSQL (Aiven.io) |
| Storage | Supabase Storage |
| Deployment | Vercel |

## 📁 Project Structure

```text
RealState/
├── backend/
│   ├── config/              # Django settings, WSGI/ASGI, root URLs
│   │   └── settings/        # base.py, development.py, production.py
│   ├── apps/
│   │   ├── accounts/        # Custom User model, roles, JWT auth
│   │   ├── common/          # Base models, Supabase storage service, pagination, health check
│   │   ├── properties/      # Property listings
│   │   ├── clients/         # Client / mini-CRM
│   │   ├── deals/           # Deal pipeline & commission logic
│   │   ├── payments/        # Installment ledger & receipts
│   │   └── reports/         # Reports & analytics (planned)
│   ├── manage.py
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/                # Next.js frontend application
├── ARCHITECTURE.md
└── README.md
```

## 🚀 Getting Started

### Backend (Django + DRF)

**Prerequisites:** Python 3.11+, virtualenv

```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:

```ini
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_URL=postgres://user:password@host.aivencloud.com:port/defaultdb?sslmode=require

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-api-key
SUPABASE_BUCKET_NAME=real-estate-media

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Run it:

```bash
python manage.py migrate
python manage.py runserver 8000
```

- API: `http://localhost:8000/`
- Health check: `http://localhost:8000/api/v1/health/`

Run tests:

```bash
pytest
```

### Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Runs at `http://localhost:3000/`.

## 📡 API Endpoints (v1)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/health/` | System & DB health check | No |
| `POST` | `/api/v1/auth/login/` | JWT login | No |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh access token | No |
| `GET/PATCH` | `/api/v1/auth/me/` | Authenticated user profile | Yes |
| `GET/POST` | `/api/v1/properties/` | Property listings | Yes |
| `GET/POST` | `/api/v1/clients/` | Clients (mini-CRM) | Yes |
| `GET/POST` | `/api/v1/deals/` | Deal pipeline | Yes |
| `POST` | `/api/v1/deals/<id>/generate-installment-plan/` | Auto-generate payment schedule | Yes |
| `GET/POST` | `/api/v1/payments/` | Payment ledger | Yes |
| `GET` | `/api/v1/payments/<id>/receipt/` | Receipt data | Yes |
| `GET` | `/api/v1/dashboard/summary/` | Live dashboard metrics | Yes |
| `GET` | `/api/v1/reports/` | Reports (planned) | Yes |

## 🗺️ Roadmap

- [ ] Reports & analytics module
- [ ] Leads/prospect pipeline (pre-deal stage)
- [ ] Public-facing property listing site

## 📄 License

This project is open source and available for review as a portfolio piece.

---

Built by **Khurram** — [GitHub](https://github.com/KhurramShams)
