# Alliance Street Accounting ERP

## Overview

This is a full-stack internal ERP (Enterprise Resource Planning) system built for **Alliance Street Accounting Private Limited**. It replaces Excel-based compliance tracking and assignment tracking with a structured web application. The system manages clients (UK/UAE), VAT compliance records, task assignments, user management, audit logs, and notifications.

The app follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database, all served from a single process in production.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite-based SPA)
- `server/` — Express backend API
- `shared/` — Shared code between frontend and backend (database schema, types)
- `migrations/` — Drizzle ORM database migrations
- `script/` — Build scripts

### Frontend Architecture
- **Framework**: React with TypeScript
- **Bundler**: Vite (dev server on port 5000, proxied through Express in dev)
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Charts**: Recharts for dashboard visualizations
- **Fonts**: Outfit (headers) + Inter (body text)

Key pages: Login, Dashboard, Clients, Compliance (VAT tracking), Tasks, Users

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript, executed via `tsx` in dev
- **API Pattern**: REST API under `/api/*` prefix
- **Authentication**: JWT-based (token stored in localStorage, sent as Bearer header)
- **Authorization**: Role-based access control with three roles: `super_admin`, `admin`, `employee`
- **Password Hashing**: bcryptjs
- **Build**: esbuild bundles server to `dist/index.cjs` for production

The server serves the Vite dev server in development and static files from `dist/public` in production.

### Database
- **Database**: PostgreSQL (required, connected via `DATABASE_URL` env var)
- **ORM**: Drizzle ORM with `drizzle-kit` for schema management
- **Schema Location**: `shared/schema.ts` — single source of truth for all tables
- **Schema Push**: Use `npm run db:push` to sync schema to database (no migration files needed for dev)

### Database Tables
1. **users** — id, name, email, password (hashed), role (super_admin/admin/employee)
2. **clients** — company info, country (UK/UAE), license expiry, corporate tax dates, status
3. **vat_records** — VAT quarter tracking per client with status and due dates
4. **tasks** — task assignments with priority, status, assigned user, due dates
5. **audit_logs** — tracks user actions (CREATE, UPDATE, DELETE, LOGIN, EXPORT)
6. **notifications** — per-user notifications with read/unread status
7. **conversations** / **messages** — AI chat integration tables (Replit AI integrations)

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface with methods for all CRUD operations
- Implementation uses Drizzle ORM queries against PostgreSQL

### Authentication Flow
1. User logs in via `/api/auth/login` with email/password
2. Server verifies credentials with bcrypt, returns JWT token
3. Client stores token in `localStorage` as `erp_token`
4. All API requests include `Authorization: Bearer <token>` header
5. `authenticate` middleware validates JWT on protected routes
6. `requireRole` middleware enforces role-based access

### Seed Data
- `server/seed.ts` creates an initial super_admin user on first run
- Default credentials: `shaukin@alliancestreet.ae` / `Sapna@12345$$`

### API Client (Frontend)
- `client/src/lib/api.ts` — wrapper around fetch that auto-attaches JWT tokens and handles 401 redirects
- `client/src/lib/queryClient.ts` — TanStack Query client configuration

### Dev vs Production
- **Dev**: `npm run dev` starts Express + Vite HMR middleware on a single port
- **Build**: `npm run build` runs Vite build (client) + esbuild (server) → outputs to `dist/`
- **Production**: `npm start` serves the built app from `dist/`

## External Dependencies

### Required Services
- **PostgreSQL Database** — Connected via `DATABASE_URL` environment variable. Required for the app to start.

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `JWT_SECRET` — Secret for signing JWT tokens (defaults to a hardcoded fallback, should be set in production)
### Key NPM Dependencies
- **express** — HTTP server
- **drizzle-orm** + **drizzle-kit** — Database ORM and migration tooling
- **pg** — PostgreSQL client
- **bcryptjs** — Password hashing
- **jsonwebtoken** — JWT authentication
- **zod** + **drizzle-zod** — Schema validation
- **recharts** — Dashboard charts
- **wouter** — Client-side routing
- **date-fns** — Date manipulation
- **react-day-picker** — Calendar component
- **jspdf** + **jspdf-autotable** — PDF export for payroll data
- **xlsx** — Excel export for payroll data