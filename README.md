# CE Credit Tracker

Angular 21 + Bootstrap 5 application for tracking continuing education credits and annual compliance goals. Built for DigitalChalk / PCM Texas.

## Features

- **Learner Dashboard** — progress bars per credit type, overall compliance status, recent activity
- **Credit Types** — define custom credit categories (CEUs, Safety Credits, Ethics Hours, etc.)
- **Goal Builder** — three assignment methods:
  - Rule-based (auto-assign by job title, department, role, or tag)
  - Bulk assignment (select any group of users)
  - Individual assignment (custom goal per learner)
- **Team Report** — manager/admin view with per-user compliance status, filters, and CSV export
- **Credit Log** — manually record completed training with course name, date, and source
- **Role-based access** — admin / manager / learner views
- **Admin bypass** — `VIPLS` / `DC2026` logs in as Patrick (CEO/admin)

## Setup

### 1. Supabase Schema

Run `supabase-schema.sql` in the Supabase SQL Editor for project:
`https://tnlxzzjxqourhjvunuxi.supabase.co`

### 2. Environment Keys

Update both environment files with your Supabase anon key:
`src/environments/environment.ts` and `src/environments/environment.prod.ts`

```ts
supabaseKey: '<your-supabase-anon-key>',
```

### 3. Install and Run

```bash
npm install
npm start           # dev server at http://localhost:4200
npm run build:prod  # production build → dist/credittracker/browser
```

### 4. Vercel Deployment

Pre-configured with `vercel.json`. Import into Vercel under the `patrick-3532s-projects` team.

## Shared Auth

Uses the same Supabase `app_users` table as RADAR Sales App and Incident App (SHA-256 hashed passwords).

## Tech Stack

Angular 21 · Bootstrap 5.3 · Bootstrap Icons · Supabase · Vercel