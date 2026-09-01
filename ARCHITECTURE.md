# Architecture & Scalability Guide

## 1. System Overview & Modular Monolith

This project is architected as a **domain-driven Modular Monolith**. It runs as a single deployable Django application with strict domain separation in `backend/apps/`:

- `accounts/`: User authentication, custom user model, and Role-Based Access Control (RBAC).
- `common/`: Shared base models (`TimeStampedUUIDModel`), global pagination, and external integration utilities (Supabase Storage).
- `properties/`: Real estate property listings, media references, amenities, and search/filter metadata.
- `clients/`: Client management (buyers, sellers, tenants, landlords) with agent-scoped visibility.
- `deals/`: Deal pipeline, commission calculation, installment plan terms, and property status synchronization.
- `payments/`: Installment ledger, payment tracking, receipts.
- `reports/`: Aggregated business intelligence, revenue metrics, and agent performance reports. *(Planned — not yet implemented.)*

> **Note on scope**: A `leads/` app (prospect intake and pipeline stages prior to a formal deal) was deliberately scoped out of this version. Deals link directly to `clients` and `properties` without a Lead intermediary. This may be revisited in a future iteration.

### Why Modular Monolith?
- **Zero Microservice Overhead**: Avoids distributed transactions, network latency between services, complex orchestration, and redundant deployment pipelines.
- **Strict Domain Boundaries**: Apps do not reach directly into each other's private implementation details; interactions occur through clean public methods/services or foreign keys.
- **Service Splitting Path**: If high-traffic components (e.g. public property search or webhook listeners) require independent scaling, their isolated app structure allows extracting them into microservices or serverless functions with minimal refactoring.

---

## 2. Database & Data Layer Design

### Primary Key Strategy: UUIDv4
All domain models inherit from `apps.common.models.TimeStampedUUIDModel`, which uses `uuid.uuid4` primary keys.

**Justification**:
1. **Security against Enumeration**: Sequential integer IDs (e.g., `/deals/123/`) allow competitors or malicious actors to gauge transaction volume and scrape data. UUIDs (`/deals/a8f23c91-.../`) are cryptographically unguessable.
2. **Distributed & Client-Side Generation**: Records can be pre-assigned IDs during batch migrations or offline data collection without database sequence synchronization.
3. **Frictionless Data Merges & Service Splitting**: Merging historical databases or extracting an app into a separate service requires no primary key remapping.

### Indexing Strategy
To support tens of thousands of properties, clients, and deals without query degradation:
- **Composite Indexes**, matched to real query patterns:
  - Properties: `[status, price]`, `[city, property_type, status]`, `[city, locality]`, `[listing_type, status]`, `[property, is_primary]` (cover photo lookup)
  - Clients: `[assigned_agent, client_type]`, `[preferred_city, client_type]`, `[full_name, client_type]`
  - Deals: `[agent, deal_status]`
  - Payments: `[deal, installment_number]`
- **Lookup Indexes**: `phone_number`, `email`, `cnic`, and foreign keys are explicitly indexed.
- **Created Timestamp Index**: `created_at` is indexed on all models to ensure fast ordering and time-sliced analytics queries.

### Query Hygiene & Avoiding N+1 Queries
All viewsets and query methods enforce:
- `select_related()` for single-valued relationships (ForeignKeys, OneToOne).
- `prefetch_related()` for multi-valued relationships (ManyToMany, reverse ForeignKeys).
- Explicit `only()` or `values()` for high-volume tabular reports to minimize memory overhead.

### Binary Data Separation
- **Zero raw binary storage in PostgreSQL**: Property photos and other media are stored exclusively in **Supabase Storage** buckets.
- The PostgreSQL database only stores validated URLs and storage path keys.

---

## 3. Authentication & RBAC Foundation

### JWT Authentication via `djangorestframework-simplejwt`
**Justification**:
- **Stateless**: Eliminates session synchronization bottlenecks across multiple application server instances.
- **Decoupled Frontend**: Integrates cleanly with the Next.js client and future mobile applications.
- **Token Rotation**: Short-lived access tokens (default: 60 minutes) paired with rotating refresh tokens (7 days) provide strong security with seamless session continuity.

### Role Hierarchy
Roles configured on `User.role`:
1. `ADMIN`: Agency Owner & Managing Director. Full system access, including client/deal reassignment between agents.
2. `AGENT`: Real estate agent. Manages own listings, clients, and deals; scoped visibility elsewhere (isolation returns `404`, not `403`, to avoid confirming another agent's record exists).
3. `ACCOUNTANT`: Finance/billing personnel. Full read/write on Payments (their core responsibility); on Deals, restricted to updating `commission_status` only — all other deal fields are read-only for this role.
4. `STAFF`: Office administrative staff. Read-only across all modules.

---

## 4. Supabase Storage Integration Pattern

All file handling uses `apps.common.services.storage.SupabaseStorageService`, a centralized singleton so every module (property images, future document types) integrates the same way.

- Uploads are validated for file type (JPEG/PNG/WEBP) and size (≤10MB) before reaching storage.
- Uploads, updates, and deletes flow through the single service interface — no scattered inline storage calls in individual apps.

---

## 5. Pagination Strategy (Day One)

All DRF list endpoints inherit the global `StandardResultsSetPagination`:
- **Default Page Size**: 20 items.
- **Max Page Size**: 100 items (enforced cap).
- **Metadata**: Standardized response schema containing `count`, `total_pages`, `current_page`, `page_size`, `next`, `previous`, and `results`.

**Impact**: Guarantees that list endpoints will never perform unbounded table scans or serialize thousands of records into memory at once under large data volumes.

---

## 6. Domain Business Logic Decisions

A few module-specific rules worth documenting explicitly, since they weren't obvious from the schema alone:

### Properties
- Final price is entered manually by the agent — there is no derived `price_per_unit` calculation. This field was implemented and then deliberately removed once it was clear it added no value on top of manual pricing.
- `bedrooms`/`bathrooms` are not modeled — property inventory spans plots and commercial units where these fields don't universally apply, and they were removed by decision rather than left as an oversight.

### Deals
- **Commission precedence rule**: `commission_percentage` is always authoritative. If both `commission_percentage` and `commission_amount` are submitted together (or if `agreed_price` changes later on an existing deal), `commission_amount` is recalculated from `commission_percentage` — never the other way around. `commission_amount` is only used to derive an initial `commission_percentage` on first creation if no percentage was supplied.
- **Duplicate active deal prevention**: a Property cannot have two deals simultaneously in an active status (`negotiation`, `booked`, `in_progress`).
- **Property status synchronization**: completing a sale/rent deal updates the linked Property to `sold`/`rented`. Cancelling a deal reverts the Property to `available` *only if no other active deal exists on it* — this safeguard is explicitly tested to avoid incorrectly freeing up a property that's still under negotiation via a different deal.

### Payments
- **Five-state effective status**, computed dynamically rather than stored as a single flag: `pending`, `partial`, `partial_overdue`, `overdue`, `paid`. The distinction between `partial_overdue` and plain `overdue` exists so a collections view can tell "still owes everything and it's late" apart from "already paying, but behind" — both are still caught by a single `overdue=true` filter for convenience, with a more granular `effective_status` filter available when the distinction matters.
- Installment plans are auto-generated from a Deal's `agreed_price - booking_amount`, split evenly across `number_of_installments`, with any rounding remainder absorbed into the final installment so the total always reconciles exactly.
- Regenerating an existing installment plan requires an explicit `force` flag and `ADMIN` role, to prevent accidentally overwriting a live payment schedule.

### Dashboard
- A single aggregated `GET /api/v1/dashboard/summary/` endpoint serves all summary metrics in one call (property status breakdown, active/completed deals, monthly revenue and commission, pending/overdue payment totals, client count) using database-level aggregation rather than in-Python summation.
- The endpoint is role-aware: an `AGENT` receives numbers scoped to their own deals/clients/payments; `ADMIN`, `ACCOUNTANT`, and `STAFF` receive agency-wide figures.

---

## 7. Deployment Topology

- **Current**: Frontend (Next.js) and backend (Django) both deployed on **Vercel**, with the database on **Aiven PostgreSQL** and media on **Supabase Storage**.
- A single-VPS deployment path (Django behind Gunicorn + Nginx, with Certbot-issued TLS) was also prepared and documented as an alternative/future option, giving a route off Vercel if the agency's traffic or budget profile changes.

---

## 8. Future Scalability Roadmap (When Needed)

### A. Caching Strategy (Redis)
When read traffic expands, Redis caching will be layered in without changing domain business logic:
- **Public Property Listings & Search**: Cache serialized search filter results (e.g. key: `props:filter:<hash>`, TTL: 5–15 minutes) with cache invalidation on property update signals.
- **Dashboard Analytics**: Cache the summary endpoint's heavy aggregation queries with a short TTL (e.g. 5 minutes).
- **User Permissions**: Cache resolved user role permissions to avoid repeated database lookups per authenticated request.

### B. Asynchronous Job Processing (Celery + Redis)
Long-running tasks will be dispatched to background workers:
- **Notifications & Reminders**: Payment due-date reminders, overdue payment alerts.
- **Heavy Document Generation**: Async generation of printable receipts/statements at scale (currently synchronous, structured-JSON only — no PDF generation yet).
- **Webhook Ingestion**: Processing incoming webhooks from property portals or payment gateways, if integrated later.

### C. Scaling Topology
- **Phase 1 (Current)**: Vercel-hosted frontend and backend, Aiven PostgreSQL, Supabase Storage.
- **Phase 2**: Add Redis for caching + Celery background workers; evaluate moving the backend to a dedicated VPS if Vercel's serverless model becomes a limiting factor for background jobs.
- **Phase 3 (High Scale)**: Horizontal web scaling behind a reverse proxy, with read-replica PostgreSQL on Aiven.

### D. Not Yet Built
- **Reports module**: historical trends, exportable reports, agent performance comparisons over time.
- **Leads module**: prospect intake and pipeline stages prior to a formal deal (currently out of scope; Deals link directly to Clients/Properties).
