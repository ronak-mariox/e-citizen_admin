# Admin

Klicpic admin CRM console. React 19 + Vite, plain JavaScript — same conventions
and folder layout as [agent-panel-1](../agent-panel-1/).

## Getting started

```bash
npm install
cp .env.example .env   # then point VITE_API_BASE_URL at your backend
npm run dev            # http://localhost:5175
```

Port **5175** (preview **4175**) keeps the console clear of agent-panel-1
(5173) and agent-panel-2 (5174), so all three can run at once.

## Scripts

| Script             | Purpose                             |
| ------------------ | ----------------------------------- |
| `npm run dev`      | Dev server with HMR on port 5175    |
| `npm run build`    | Production bundle into `dist/`      |
| `npm run preview`  | Serve the built bundle on port 4175 |
| `npm run lint`     | ESLint over the whole project       |
| `npm run lint:fix` | ESLint with autofix                 |

## Environment

Only `VITE_`-prefixed variables reach the browser, and everything that does is
**public** — never put secrets in `.env`.

| Variable            | Description                     |
| ------------------- | ------------------------------- |
| `VITE_APP_NAME`     | Display name for the console    |
| `VITE_API_BASE_URL` | Backend API root                |
| `VITE_API_TIMEOUT`  | Request timeout in milliseconds |

`.env` is git-ignored; `.env.example` is the tracked template — add every new
key to it.

## Layout

```
src/
├── api/         Axios instance and per-resource modules
├── assets/      Fonts and icons imported by the bundler
├── components/  Reusable presentational components
├── constants/   Brand copy, config, enums
├── context/     React context instances and their providers
├── hooks/       Custom hooks
├── layouts/     Route-level shells
├── pages/       One component per route
├── routes/      Route table and guards
├── services/    Browser/platform concerns (storage, files, notifications)
├── styles/      Global CSS and design tokens
└── utils/       Framework-agnostic helpers
```

`@` is aliased to `src/`, so `import useAuth from '@/hooks/useAuth'` works from
any depth.

## What ships today

Only the **sign-in screen** (`/login`). Every other path redirects there,
including the `/forgot-password` and `/dashboard` targets the login screen
links to — add those routes in
[src/routes/AppRoutes.jsx](src/routes/AppRoutes.jsx) as the pages land.

## Design

The login screen is a full-bleed 50/50 split: an orange gradient brand panel on
the left, the sign-in column on the right.

Every colour, size and radius lives in
[src/styles/tokens.css](src/styles/tokens.css) — restain the whole screen by
editing the three `--brand-gradient-*` stops, which the panel and the primary
button both read. Screen-specific rules are in
[src/styles/auth.css](src/styles/auth.css); brand wording is in
[src/constants/brand.js](src/constants/brand.js).

DM Sans is self-hosted from `src/assets/fonts/` — no external font requests.

Below 900px the split collapses to a single column with the panel as a compact
banner above the form.

## Calling the API

Import the shared client; never construct a new Axios instance.

```js
import { client, getErrorMessage } from '@/api/client';
```

The console assumes one staff login endpoint that takes a single `identifier`
field — an email or a mobile number both resolve through it:

```
POST /auth/login  { identifier, password }
  -> { success, statusCode, message, data: { user, accessToken, refreshToken } }
```

The refresh token also arrives as an httpOnly cookie, which is why the client
sets `withCredentials: true`. Adjust [src/api/auth.js](src/api/auth.js) if the
real service differs.

## Auth

`LoginPage` writes `accessToken` and `user` straight to `localStorage` and
sends the admin to `/dashboard`. That is a placeholder — move it into an
`AuthProvider` under `src/context/` once more than one screen needs the
session.
