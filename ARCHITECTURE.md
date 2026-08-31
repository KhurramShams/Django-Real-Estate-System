# Architecture & Scalability Guide

## 1. System Overview & Modular Monolith

This project is architected as a **domain-driven Modular Monolith**. It runs as a single deployable Django application with strict domain separation in `backend/apps/`:

- `accounts/`: User authentication, custom user model, and Role-Based Access Control (RBAC).
- `common/`: Shared base models (`TimeStampedUUIDModel`), global pagination, and external integration utilities (Supabase Storage).
- `properties/`: Real estate property listings, units, pricing, media references, and search metadata.
- `clients/`: Client management (buyers, sellers, tenants, landlords).
- `leads/`: Lead intake, pipeline stages, activity tracking, and assignment to agents.
- `deals/`: Deal pipeline, contract tracking, transaction milestones, and commissions.
- `payments/`: Invoicing, payment schedules, receipts, and ledger tracking.
- `reports/`: Aggregated business intelligence, revenue metrics, and agent performance reports.

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
To support tens of thousands of properties, clients, and leads without query degradation:
- **Composite Indexes**: Commonly combined filter fields (e.g. `['status', 'price']`, `['city', 'property_type']`, `['email', 'role']`).
- **Lookup Indexes**: Contact lookups (`phone_number`, `email`) and foreign keys are explicitly indexed.
- **Created Timestamp Index**: `created_at` is indexed on all models to ensure fast ordering and time-sliced analytics queries.

### Query Hygiene & Avoiding N+1 Queries
All viewsets and query methods must enforce:
- `select_related()` for single-valued relationships (ForeignKeys, OneToOne).
- `prefetch_related()` for multi-valued relationships (ManyToMany, reverse ForeignKeys).
- Explicit `only()` or `values()` for high-volume tabular reports to minimize memory overhead.

### Binary Data Separation
- **Zero raw binary storage in PostgreSQL**: Property photos, blueprints, contract PDFs, and client KYC documents are stored exclusively in **Supabase Storage** buckets.
- The PostgreSQL database only stores validated URLs and storage path keys (`avatar_url`, `media_url`).

---

## 3. Authentication & RBAC Foundation

### JWT Authentication via `djangorestframework-simplejwt`
**Justification**:
- **Stateless**: Eliminates session synchronization bottlenecks across multiple application server instances.
- **Decoupled Frontend**: Integrates cleanly with the Next.js client, static site generation, and future mobile applications.
- **Token Rotation**: Short-lived access tokens (default: 60 minutes) paired with rotating refresh tokens (7 days) provide strong security with seamless session continuity.

### Role Hierarchy
Initial roles configured on `User.role`:
1. `ADMIN`: Agency Owner & Managing Director (Full system access, user management, financial reports).
2. `AGENT`: Real estate agent (Manage own listings, leads, deals, and client communications).
3. `ACCOUNTANT`: Finance / billing personnel (Invoices, payment reconciliation, commissions).
4. `STAFF`: Office administrative staff (Data entry, scheduling).

---

## 4. Supabase Storage Integration Pattern

All file handling uses `apps.common.services.storage.SupabaseStorageService`.

- **Public Assets**: Property photos, floor plans, and public agent avatars use `get_public_url(path)`.
- **Private Documents**: Contracts, financial statements, and ID documents use `create_signed_url(path, expires_in=3600)` with temporary expiration.
- **Single Interface**: Uploads, updates, and deletes flow through the centralized singleton `get_storage_service()`.

---

## 5. Pagination Strategy (Day One)

All DRF list endpoints inherit the global `StandardResultsSetPagination`:
- **Default Page Size**: 20 items.
- **Max Page Size**: 100 items (enforced cap).
- **Metadata**: Standardized response schema containing `count`, `total_pages`, `current_page`, `page_size`, `next`, `previous`, and `results`.

**Impact**: Guarantees that list endpoints will never perform unbounded table scans or serialize thousands of records into memory at once under large data volumes.

---

## 6. Future Scalability Roadmap (When Needed)

### A. Caching Strategy (Redis)
When read traffic expands, Redis caching will be layered in without changing domain business logic:
- **Public Property Listings & Search**: Cache serialized search filter results (e.g. key: `props:filter:<hash>`, TTL: 5–15 minutes) with cache invalidation on property update signals.
- **Dashboard Analytics**: Cache heavy aggregation counts (total active deals, monthly closed volume) with a 5-minute TTL.
- **User Permissions**: Cache resolved user role permissions to avoid repeated database lookups per authenticated request.

### B. Asynchronous Job Processing (Celery + Redis)
Long-running tasks will be dispatched to background workers:
- **Notifications & Reminders**: Email/SMS payment reminders, lead follow-up alerts, and lease renewal notifications.
- **Heavy Document Generation**: Asynchronous generation of deal contracts (PDFs) and financial year-end statements.
- **Webhook Ingestion**: Processing incoming webhooks from real estate listing portals or payment gateways.

### C. Scaling Topology
- **Phase 1 (Current)**: Monolithic deployment on single VPS with Aiven PostgreSQL and Supabase Storage.
- **Phase 2**: Add Redis for caching + Celery background workers.
- **Phase 3 (High Scale)**: Horizontal web container scaling behind an Nginx / Cloudflare reverse proxy with read-replica PostgreSQL on Aiven.
