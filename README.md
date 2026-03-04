# RUYA — Sourcing Platform

A full-stack B2B sourcing and supply chain management platform built with Next.js 14, Prisma, and NextAuth.js.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (via Prisma ORM) |
| Auth | NextAuth.js v4 (CredentialsProvider + JWT) |
| Font | Cairo (Google Fonts — Arabic + Latin) |
| Deployment | Vercel + Neon / Supabase |

---

## Roles

| Role | Access |
|---|---|
| **CLIENT** | Submit sourcing requests, view quotations, accept/reject/revise |
| **AGENT** | View assigned requests, submit quotations, manage revisions |
| **ADMIN** | Full platform access, assign agents, manage users |

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/your-org/ruya-app.git
cd ruya-app
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
DATABASE_URL="postgresql://user:password@host:5432/ruya?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/ruya?schema=public"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

> **Tip:** For local development you can use a free [Neon](https://neon.tech) database or run PostgreSQL locally via Docker:
> ```bash
> docker run --name ruya-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ruya -p 5432:5432 -d postgres
> ```

### 3. Run database migrations

```bash
npm run db:migrate
```

### 4. Seed demo users

```bash
npm run db:seed
```

This creates three demo accounts:

| Email | Password | Role |
|---|---|---|
| admin@ruya.com | password123 | ADMIN |
| agent@ruya.com | password123 | AGENT |
| client@ruya.com | password123 | CLIENT |

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in at `/auth/login`.

---

## Database Commands

| Command | Description |
|---|---|
| `npm run db:migrate` | Create a new migration (dev) |
| `npm run db:migrate:deploy` | Apply pending migrations (production) |
| `npm run db:push` | Push schema changes without migrations (dev only) |
| `npm run db:seed` | Seed demo users |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:generate` | Regenerate Prisma client |

---

## Deploying to Vercel

### 1. Create a PostgreSQL database

Recommended: [Neon](https://neon.tech) (free tier, serverless PostgreSQL).

1. Create a new Neon project
2. Copy the **Connection string** (pooled) → `DATABASE_URL`
3. Copy the **Direct connection string** → `DIRECT_URL`

### 2. Deploy to Vercel

```bash
npx vercel
```

Or connect your GitHub repo in the [Vercel dashboard](https://vercel.com/new).

### 3. Add environment variables in Vercel

In your project settings → **Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string |
| `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |

### 4. Migrations run automatically

The build command (`prisma migrate deploy && next build`) applies all pending migrations before every deployment. No manual steps required.

### 5. Seed production data (optional)

After first deploy, run the seed script against your production database:

```bash
DATABASE_URL="your-neon-connection-string" npm run db:seed
```

---

## Project Structure

```
ruya-app/
├── app/
│   ├── (auth)/           # Login page (redirect wrapper)
│   ├── auth/login/       # Branded login page
│   ├── (client)/client/  # Client portal (dashboard, requests, quotations, orders)
│   ├── (agent)/agent/    # Agent portal (dashboard, requests, quotations)
│   ├── (admin)/admin/    # Admin portal (dashboard, users, requests, orders)
│   └── api/              # API routes (auth, client, agent, admin)
├── components/
│   ├── sidebar.tsx        # Role-based nav (desktop + mobile hamburger)
│   ├── StatusBadge.tsx    # Reusable status badge
│   ├── EmptyState.tsx     # Reusable empty state
│   └── ui/                # shadcn/ui primitives
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client singleton
│   └── utils.ts           # cn, formatCurrency, formatDate, getStatusColor
├── prisma/
│   ├── schema.prisma      # Database schema (PostgreSQL)
│   ├── seed.ts            # Demo data seeder
│   └── migrations/        # Prisma migration history
└── middleware.ts           # Route protection
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (pooled for Neon) |
| `DIRECT_URL` | ✅ | PostgreSQL direct connection (for migrations) |
| `NEXTAUTH_SECRET` | ✅ | Random 32-byte secret for JWT signing |
| `NEXTAUTH_URL` | ✅ | Canonical URL of the app |

---

## Notes

- **SQLite → PostgreSQL**: The project was originally scaffolded with SQLite. All enum types use plain `String` fields for cross-database compatibility.
- **Prisma migrations**: The `prisma/migrations/` folder contains the full migration history. Always use `prisma migrate deploy` in production — never `prisma db push`.
- **`DIRECT_URL`**: Required when using Neon's connection pooling (PgBouncer). Prisma uses `DATABASE_URL` for queries and `DIRECT_URL` for migrations.
