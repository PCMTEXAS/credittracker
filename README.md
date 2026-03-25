# CreditTracker

Credit tracking application built with Angular and Supabase.

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- A Supabase project

### Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Inject environment variables:
   ```bash
   npm run set-env
   ```
5. Start the dev server:
   ```bash
   npm start
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run set-env` | Write `.env` values into Angular environment files |

## Security

- **No hardcoded secrets** — all credentials are loaded from environment variables via `.env` (excluded from version control).
- **Supabase RLS** — Row-Level Security policies enforce access control at the database level.
- **Parameterised queries** — the Supabase JS SDK parameterises all query values automatically, preventing SQL injection.
- **Angular auto-escaping** — Angular's template binding escapes HTML by default, mitigating XSS. Avoid `[innerHTML]` with untrusted data.
- **Password hashing** — Supabase Auth uses bcrypt server-side. For any custom hashing, use bcrypt (cost ≥ 12) or Argon2id.
- **CORS** — configure allowed origins via the `ALLOWED_ORIGINS` environment variable; never use `*` in production.
