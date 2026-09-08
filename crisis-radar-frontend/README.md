# Crisis Radar — Frontend (React)

React (Vite) app that talks to the Node/PostgreSQL backend (`crisis-radar-backend`).
Same design and feature set as the earlier HTML prototype, rebuilt as a real,
routed React app with live data instead of mock data.

## Stack

- React 19 + Vite
- react-router-dom — page routing
- react-leaflet + Leaflet — live map, filters, click-to-pin reporting
- Recharts — trend/type/severity charts
- Axios — API calls to the backend, with JWT attached automatically

## 1. Get the backend running first

This app has nothing to show without the API. Set up `crisis-radar-backend`
(see its own README) so it's running at `http://localhost:4000` before
starting this.

## 2. Install and configure

```bash
npm install
cp .env.example .env
```

`.env` just needs `VITE_API_URL` — defaults to `http://localhost:4000/api`,
which matches the backend's default port.

## 3. Run it

```bash
npm run dev
```

Opens at `http://localhost:5173`. Log in with one of the backend's seeded
accounts (password `password123` for all):
- `priya@example.com` — citizen
- `bbmp.zone4@example.com` — authority
- `admin@example.com` — admin

## Pages

| Route | What it does |
|---|---|
| `/` | Home — live mini-map, stats, latest reports, 14-day trend, how-it-works |
| `/map` | Full live map with type/severity/status filters and an incident detail panel |
| `/report` | Submit a report — click the map to pin a location (requires login) |
| `/dashboard` | Role-based: citizen sees "my reports", authority gets a verify/progress/resolve queue, admin gets reports/users/categories management |
| `/insights` | Trend, hotspot, type and severity charts |
| `/login` | Login / register |

Which dashboard renders is driven entirely by the logged-in user's role
returned from the backend — there's no separate role switcher here, unlike
the earlier mock demo, since roles are now real accounts.

## Notes / known limits (Phase 1)

- Image upload for evidence is a UI placeholder — it doesn't upload anywhere yet.
- No AI/ML features yet (classification, duplicate detection, etc.) — deferred per plan.
- `npm run build` produces one large JS chunk (~860KB / ~260KB gzipped) since
  Leaflet + Recharts are both sizeable. Fine for local dev; worth code-splitting
  by route (`React.lazy`) before any real deployment.
- CORS is wide open on the backend for local dev — tighten before deploying anywhere public.

## Build for production

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally to sanity-check it
```
