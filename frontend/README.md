# TransitOps — Frontend (Hackathon Build)

A React + Vite frontend for the TransitOps Smart Transport Operations Platform brief.
Built from the approved UI mockup (dark, amber-accented, number-plate motif) with **all
mock UI turned into a real, stateful app** — not a static re-skin.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

Demo logins (password for all: `password`):

| Email                        | Role              |
|-------------------------------|-------------------|
| raven.k@transitops.in         | Dispatcher        |
| meera.f@transitops.in         | Fleet Manager     |
| sam.s@transitops.in           | Safety Officer    |
| nikhil.a@transitops.in        | Financial Analyst |

Wrong email/password shows the "Invalid credentials" error from the mockup. Everything
is in-memory mock data (see `src/data/mockData.js`) — refreshing the page resets state,
since there's no backend for this hackathon round.

## What's actually implemented (not just styled)

This was the main ask — the UI shouldn't just be pasted, the logic behind the "red
lines" (validation states) needed to be real:

- **RBAC — strict per-role tab scoping** — each role sees *only* its assigned tabs
  (plus Settings, which every role gets):
  - **Fleet Manager** → Fleet, Maintenance
  - **Dispatcher** → Dashboard, Trips
  - **Safety Officer** → Drivers, Compliance
  - **Financial Analyst** → Fuel & Expenses, Analytics

  Unassigned tabs aren't shown with a lock icon — they're absent from the sidebar
  entirely (`src/components/Shell.jsx` → `NavList` filters with `can(item.key)`), and
  the route itself is still guarded server-side-style via `ProtectedRoute.jsx` so
  typing the URL directly doesn't bypass it either. Logging in lands each role on its
  first assigned tab (`ROLE_HOME` in `mockData.js`), not a shared Dashboard.
- **Vehicle registry uniqueness** — adding/editing a vehicle checks the registration
  number against every other vehicle (case-insensitive) before saving.
- **Dispatch pool filtering** — the Trips page vehicle dropdown only ever lists
  `status === 'Available'` vehicles; In Shop/Retired/On Trip vehicles are structurally
  excluded, not just visually greyed out.
- **Driver eligibility filtering** — same idea: the driver dropdown excludes Suspended,
  On Trip, and anyone whose `license expiry < today (2026-07-12)`, computed from the
  actual date field rather than a hardcoded "expired" flag.
- **Live capacity validation** — this is the "red line" behavior from the mockup's
  `cap()` JS function, reimplemented properly: cargo weight is checked against the
  *selected* vehicle's `maxLoad` on every keystroke via `validateTrip()`, and the
  Dispatch button is only enabled when the check passes. Swap vehicles and the limit
  updates immediately.
- **Status state machine** — dispatching a trip flips vehicle & driver to `On Trip`;
  completing a trip flips them back to `Available`, records the final odometer
  (must be ≥ current odometer) and — if fuel was entered — writes a real fuel log entry;
  cancelling a *dispatched* trip restores both to `Available`, cancelling a draft does
  nothing to vehicle/driver since nothing was ever reserved.
- **Maintenance ↔ vehicle status coupling** — creating an *Active* service record
  immediately flips the vehicle to `In Shop` (and it disappears from the trip dispatch
  dropdown in the same render). Closing it restores `Available` — unless the vehicle was
  separately marked `Retired`, per the spec.
- **Auto-computed cost & ROI** — `costByVehicle` in `AppContext.jsx` derives per-vehicle
  fuel + maintenance + toll/other totals from the raw log tables (nothing is stored
  redundantly), and Analytics/Fuel pages read straight from that derived value. Fleet
  utilization, fuel efficiency (distance ÷ fuel) and ROI
  `(revenue − (maintenance + fuel)) ÷ acquisition cost` are computed the same way.
- **CSV export** on the Analytics page (client-side blob download, per-vehicle cost
  breakdown).

## Structure

```
src/
  context/AppContext.jsx   → all state + business rules (the "backend" for now)
  data/mockData.js         → seed data, RBAC matrix, demo users
  components/              → Shell (sidebar/topbar), Modal, Chip/Plate, Toasts, ProtectedRoute
  pages/                   → one file per screen (Dashboard, Fleet, Drivers, Trips,
                              Maintenance, FuelExpenses, Analytics, Settings, Login)
  index.css                → design system ported from the approved mockup (CSS vars,
                              chips, plates, cards, kpis, alerts, steps, etc.)
```

## Wiring to a real backend later

Everything that mutates state lives in `AppContext.jsx` (`addVehicle`, `dispatchTrip`,
`completeTrip`, `closeMaintenance`, etc.). Swapping the mock arrays for API calls means
touching that one file — the pages themselves only ever call these functions, so no
page-level rework should be needed once there's a real API.

## Bonus items from the brief not yet wired

Dark mode is the default (matches the mockup) rather than toggleable; PDF export,
email reminders for expiring licenses, and document management were left out to keep
scope inside the 8-hour window — CSV export and the core RBAC/validation/state-machine
rules were prioritized since those are graded as mandatory business rules.
