# Karigar — Hyperlocal Services Marketplace

Karigar is a role-based web app connecting Customers with nearby Service Providers, with optional Admin oversight. It focuses on simplicity, usability, and mobile-first design suitable for hackathon delivery.

## Quick Start
- Open `index.html` in any modern browser.
- Sign in with:
  - Admin: `admin@karigar.local` / `admin123`
  - Sample Providers: `p1@karigar.local`, `p2@karigar.local`, `p3@karigar.local` / `provider123`
- Or create a new account as `Customer` or `Service Provider`.

## Features
- Customer: search by category/city, view profiles, send requests, track status, review after completion.
- Provider: manage profile, accept/reject requests, mark jobs completed, view booking history.
- Admin: suspend/restore users, view platform metrics.
- Roles enforced in UI state and actions with session management.

## Tech Stack
- Frontend: Vanilla JS + Pico.css, mobile-first responsive design.
- Persistence: Browser `localStorage` (hackathon-ready). Passwords hashed client-side on first login.

## Project Structure
```
.
├─ index.html
├─ assets/
│  ├─ css/
│  │  └─ style.css
│  └─ js/
│     └─ app.js
└─ README.md
```

## Backend Option (Future)
- Recommended: Node.js + Express + SQLite/Postgres with JWT auth.
- Suggested folders if you extend:
```
server/
├─ src/
│  ├─ app.ts
│  ├─ routes/
│  ├─ middleware/
│  └─ db/
└─ package.json
```
- API endpoints: `POST /auth/login`, `POST /auth/register`, `GET /providers`, `POST /requests`, `PATCH /requests/:id`.

## Team
- Ayesha Bint E Younas, Farah Tanveer, Gulshan Mushtaq
