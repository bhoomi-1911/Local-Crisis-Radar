# Crisis Radar — Backend (Phase 1: Core CRUD)

Express + PostgreSQL API for reports, users and auth. This matches the data
shape used in the frontend prototype (`local-crisis-radar-demo.html`) so the
two are easy to wire together later. No AI/ML yet — that's Phase 2.

## 1. Prerequisites

- Node.js 18+ (`node -v` to check)
- PostgreSQL installed and running locally
  - macOS: `brew install postgresql@16 && brew services start postgresql@16`
  - Windows: install via the official installer at postgresql.org, or use WSL
  - Linux: `sudo apt install postgresql` then `sudo service postgresql start`
- `psql` command-line client available (comes with the Postgres install above)

## 2. Create the local database

```bash
createdb crisis_radar
# or, if that command isn't on your PATH:
psql -U postgres -c "CREATE DATABASE crisis_radar;"
```

## 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` to match your local Postgres user/password,
e.g. `postgresql://postgres:yourpassword@localhost:5432/crisis_radar`.
Also replace `JWT_SECRET` with any random string (e.g. run
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

## 4. Install dependencies

```bash
npm install
```

## 5. Create tables and load sample data

```bash
npm run db:setup
```

This runs `src/db/schema.sql` (tables, enums, indexes) followed by
`src/db/seed.sql` (3 sample users + 5 sample reports, matching the frontend
demo's Bengaluru locations). If `psql` isn't on your PATH, run the two files
manually instead:

```bash
psql "$DATABASE_URL" -f src/db/schema.sql
psql "$DATABASE_URL" -f src/db/seed.sql
```

Seeded login for testing (all three accounts share this password):
- `priya@example.com` / `password123` (role: citizen)
- `bbmp.zone4@example.com` / `password123` (role: authority)
- `admin@example.com` / `password123` (role: admin)

## 6. Run the server

```bash
npm run dev      # auto-restarts on file changes, via nodemon
# or
npm start
```

You should see `Crisis Radar API listening on http://localhost:4000`.
Check it's alive: `curl http://localhost:4000/api/health`

## API reference

All bodies are JSON. Protected routes need `Authorization: Bearer <token>`,
where `<token>` comes from `/api/auth/login` or `/api/auth/register`.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{ name, email, password, role? }` → user + token |
| POST | `/api/auth/login` | — | `{ email, password }` → user + token |
| GET | `/api/auth/me` | required | current user's profile |

### Reports
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/reports` | — | list, filterable by `?type=&severity=&status=&q=` |
| GET | `/api/reports/stats/summary` | — | counts + trend data, powers the home/insights views |
| GET | `/api/reports/mine` | required | current user's own submitted reports |
| GET | `/api/reports/:id` | — | one report |
| POST | `/api/reports` | required | create a report (any logged-in role) |
| PATCH | `/api/reports/:id/status` | authority/admin | `{ status }` — one of reported/verified/progress/resolved |
| DELETE | `/api/reports/:id` | admin | remove a report (e.g. spam) |

### Users (all admin-only)
| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | list all users with report counts |
| PATCH | `/api/users/:id/role` | `{ role }` |
| PATCH | `/api/users/:id/suspend` | `{ is_active }` |

## Quick test with curl

```bash
# Log in as the seeded authority account
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bbmp.zone4@example.com","password":"password123"}'

# Copy the returned token, then verify a report:
curl -s -X PATCH http://localhost:4000/api/reports/3/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <paste token here>" \
  -d '{"status":"verified"}'
```

## Project layout

```
src/
  server.js            entry point
  app.js               express app, route mounting
  config/db.js         postgres connection pool
  db/schema.sql         tables, enums, indexes, triggers
  db/seed.sql            sample users + reports
  middleware/auth.js      JWT verification
  middleware/role.js      role-based access guard
  middleware/errorHandler.js
  controllers/           request handlers per resource
  routes/                route definitions per resource
  utils/jwt.js           sign/verify helpers
```

## What's deliberately not here yet (Phase 2)

- AI/ML: crisis classification, severity prediction, location extraction,
  duplicate/misinformation detection, clustering, trend anomaly detection,
  multilingual NLP, RAG assistant
- Image upload storage (evidence_url is just a text column for now — point it
  at a future S3/Cloudinary URL)
- Real-time updates (would add Socket.io or Server-Sent Events)
- PostGIS for proper geospatial queries (lat/lng are plain numeric columns)

These are exactly the pieces we discussed for the AI-oriented roadmap — happy
to scope and build them incrementally once this core layer is solid.
