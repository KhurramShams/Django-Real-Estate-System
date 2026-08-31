# Real Estate Management System

A single-tenant real estate management system built for property agencies to manage listings, client leads, deal pipelines, transactions, payments, and reporting.

## Tech Stack
- **Backend**: Django 5.1, Django REST Framework, SimpleJWT
- **Frontend**: Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Database**: PostgreSQL (Hosted on Aiven.io)
- **Storage**: Supabase Storage (property media, contracts, documents)

---

## Project Structure

```text
RealState/
├── backend/
│   ├── config/              # Django settings, WSGI/ASGI, root URLs
│   │   └── settings/        # base.py, development.py, production.py
│   ├── apps/
│   │   ├── accounts/        # Custom User model, Role enum, JWT Auth
│   │   ├── common/          # Base models, Supabase storage service, pagination, health check
│   │   ├── properties/      # Property listings domain
│   │   ├── clients/         # Clients domain
│   │   ├── leads/           # Leads domain
│   │   ├── deals/           # Deals & transactions domain
│   │   ├── payments/        # Payments & invoicing domain
│   │   └── reports/         # Reports & analytics domain
│   ├── manage.py
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/                # Next.js frontend application
├── ARCHITECTURE.md          # Architecture & future scalability plan
└── README.md
```

---

## Local Setup Guide

### 1. Backend Setup (Django + DRF)

#### Prerequisites
- Python 3.11+
- Virtualenv

#### Setup Steps
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy example environment file
cp .env.example .env
```

#### Configure `.env`
Edit `backend/.env` with your credentials:
```ini
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database: Aiven PostgreSQL or SQLite for local dev
USE_SQLITE=False
DATABASE_URL=postgres://avnadmin:password@host.aivencloud.com:port/defaultdb?sslmode=require

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-api-key
SUPABASE_BUCKET_NAME=real-estate-media

# Frontend CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Run Migrations & Start Backend
```bash
python manage.py migrate
python manage.py runserver 8000
```
Backend API will be available at: `http://localhost:8000/`
Health check endpoint: `http://localhost:8000/api/v1/health/`

#### Run Tests
```bash
pytest
```

---

### 2. Frontend Setup (Next.js)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Copy environment variables
cp .env.local.example .env.local

# Run development server
npm run dev
```
Frontend will be accessible at `http://localhost:3000/`.

---

## Database & Migration Strategy

1. **UUID Primary Keys**: All domain models inherit from `apps.common.models.TimeStampedUUIDModel` using UUIDv4 primary keys.
2. **Migrations Workflow**:
   - Always run `python manage.py makemigrations <app_name>` when modifying models.
   - Review generated SQL using `python manage.py sqlmigrate <app_name> <migration_number>`.
   - Apply migrations via `python manage.py migrate`.
3. **No Large Binary in Postgres**: Files are uploaded to Supabase Storage; Postgres only stores URL strings.

---

## API Endpoints (v1)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/health/` | System & DB health check | No |
| `POST` | `/api/v1/auth/login/` | JWT login (returns access + refresh tokens & user role) | No |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh JWT access token | No |
| `POST` | `/api/v1/auth/register/` | Register new staff / agent | No / Admin |
| `GET/PATCH` | `/api/v1/auth/me/` | Authenticated user profile | Yes (Bearer JWT) |
| `GET/POST` | `/api/v1/properties/` | Properties module (upcoming) | Yes |
| `GET/POST` | `/api/v1/clients/` | Clients module (upcoming) | Yes |
| `GET/POST` | `/api/v1/leads/` | Leads module (upcoming) | Yes |
| `GET/POST` | `/api/v1/deals/` | Deals module (upcoming) | Yes |
| `GET/POST` | `/api/v1/payments/` | Payments module (upcoming) | Yes |
| `GET` | `/api/v1/reports/` | Reports module (upcoming) | Yes |
