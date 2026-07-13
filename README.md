# TransitOps — Smart Transport Operations Platform
 
TransitOps is a centralized platform for managing the complete lifecycle of transport operations — from vehicle registration and driver management to trip dispatching, maintenance, fuel logging, and analytics. It is built to replace the spreadsheets and manual logbooks that logistics companies typically rely on, enforcing business rules automatically and giving operators real-time visibility into their fleet.
 
This repository was built for the Odoo Hackathon 2026.
 
## Project Structure
 
```
.
├── app/                        # Main application backend source code
│   ├── api/                    # API endpoints and route controllers
│   │   └── auth.py             # Authentication routes
│   ├── core/                   # Core configuration and security setup
│   │   ├── config.py           # Application settings and configurations
│   │   ├── dao.py              # Data Access Object pattern/database layers
│   │   └── security.py         # Password hashing, JWT tokens, etc.
│   ├── models/                 # Database ORM models
│   │   └── models.py           # Schema definitions for database tables
│   ├── database.py             # Database connection setup
│   └── main.py                 # FastAPI/Flask application entry point
├── database/                   # Database scripts and migrations
│   ├── database_generator.py   # Script to populate/generate databases
│   ├── database.sql            # Schema + seed data, auto-loaded by the db container on first run
│   └── schema.sql              # Structural DDL queries (Tables, Views)
├── frontend/                   # Web frontend user interface
│   └── index.html              # Main application entry webpage
├── docker-compose.yml          # Orchestrates the db, frontend, and backend containers
├── Dockerfile                  # Backend container image definition
├── .gitignore                  # Git ignore definitions
└── README.md                   # Project documentation
```
 
## Tech Stack
 
### Backend
- FastAPI
- PyJWT for authentication
- Passlib (bcrypt) for password hashing
- Pydantic Settings for configuration
- MariaDB (schema provided in `database/schema.sql`)
### Frontend
- React 18 with Vite
- React Router (HashRouter)
- Tailwind CSS
- Framer Motion for animations
- Lucide React for icons
### Infrastructure
- Docker Compose runs `db`, `frontend`, and `backend` together for local development
- MariaDB and the FastAPI backend run in containers; the frontend dev server runs on a plain `node:18-alpine` image against the mounted `frontend/` folder
## Getting Started
 
The project runs entirely through Docker Compose — no local Python or Node install is required.
 
**Prerequisites:** Docker Desktop, or Docker Engine plus the Compose plugin (the `docker compose` v2 CLI used below).
 
From the project root:
 
```bash
docker compose up --build --remove-orphans
```
 
This builds and starts three containers:
 
| Service | Container | Port | Role |
|---|---|---|---|
| `db` | `transitops_database` | 3306 | MariaDB, seeded from `database/database.sql` on first run |
| `frontend` | `transitops_frontend` | 5173 | `npm install && npm run dev` against the mounted `frontend/` folder |
| `backend` | `transitops_backend` | 8000 | FastAPI via Uvicorn (`--reload`), built from the root `Dockerfile` |
 
`db` must pass its healthcheck before `frontend` starts; `backend` waits for `db` to be healthy and for `frontend` to have started. The first run takes longer while npm installs packages and the backend image builds — after that, startup is quick.
 
Once running:
- Frontend: http://localhost:5173
- Backend + docs: http://localhost:8000 and http://localhost:8000/docs
- MariaDB: `localhost:3306` (`mock` / `mock`, database `transitops`) — reachable from host DB tools, or as `db` from other containers
> Database credentials, `SECRET_KEY`, and `ALGORITHM` are set as plain values in `docker-compose.yml` for local/hackathon use — change them before running this anywhere beyond your own machine.
 
> If `localhost:5173` doesn't load, confirm Vite's dev server is bound to `0.0.0.0` (e.g. `vite --host`, or `server.host` in `vite.config`) rather than `127.0.0.1`, which isn't reachable from outside the container.
 
The frontend still runs on in-memory mock data (`src/data/mockData.js`) rather than the live backend, so the `backend` and `db` containers run alongside it but aren't wired to the UI yet — refreshing the page resets state. All state-mutating logic lives in `AppContext.jsx`, so connecting it to the FastAPI backend later means updating that one file rather than reworking individual pages.
 
**Common commands**
 
| Command | Effect |
|---|---|
| `docker compose down` | Stop and remove containers; MariaDB data is kept |
| `docker compose down -v` | Also wipe the MariaDB volume — the next `up` re-runs `database.sql` from scratch |
| `docker compose up --build` | Rebuild after editing the `Dockerfile` or `requirements.txt` |
| `docker compose logs -f <service>` | Tail logs for `db`, `frontend`, or `backend` |
 
Frontend dependency changes don't need an explicit rebuild — `npm install` runs again on every `docker compose up`.
 
## Demo Logins
 
Password for all accounts: `password`
 
| Email | Role |
|---|---|
| `raven.k@transitops.in` | Dispatcher |
| `meera.f@transitops.in` | Fleet Manager |
| `sam.s@transitops.in` | Safety Officer |
| `nikhil.a@transitops.in` | Financial Analyst |
 
These accounts are seeded automatically as part of `database/database.sql` the first time the `db` container initializes. Each role lands on its own default tab after login rather than a shared dashboard, and only sees the tabs relevant to that role.
 
## Core Features
 
### Role-Based Access Control
Each role sees only its assigned tabs (plus Settings, which every role gets):
- Fleet Manager: Fleet, Maintenance
- Dispatcher: Dashboard, Trips
- Safety Officer: Drivers, Compliance
- Financial Analyst: Fuel & Expenses, Analytics
Unassigned tabs are absent from the sidebar entirely rather than shown locked, and routes are guarded so navigating to a URL directly does not bypass the restriction.
 
### Vehicle Registry Uniqueness
Adding or editing a vehicle checks its registration number against every other vehicle, case-insensitive, before saving.
 
### Dispatch Pool Filtering
The Trips page vehicle dropdown only lists vehicles with status "Available"; vehicles that are in the shop, on a trip, or retired are excluded rather than just greyed out.
 
### Driver Eligibility Filtering
The driver dropdown excludes suspended drivers, drivers already on a trip, and any driver whose license has expired, computed from the actual expiry date rather than a stored flag.
 
### Live Capacity Validation
Cargo weight is checked against the selected vehicle's maximum load on every keystroke. The dispatch action is only enabled once the check passes, and the limit updates immediately if the vehicle selection changes.
 
### Status State Machine
- Dispatching a trip sets the vehicle and driver to "On Trip".
- Completing a trip sets them back to "Available", records the final odometer reading, and logs a fuel entry if fuel was entered.
- Cancelling a dispatched trip restores the vehicle and driver to "Available"; cancelling a draft trip has no effect on either, since nothing was reserved.
### Maintenance and Vehicle Status Coupling
Creating an active service record immediately sets the vehicle to "In Shop", removing it from the trip dispatch pool. Closing the service record restores "Available", unless the vehicle has separately been marked "Retired".
 
### Auto-Computed Cost and ROI
Per-vehicle fuel, maintenance, and toll/other totals are derived directly from the underlying log tables rather than stored redundantly. Fleet utilization, fuel efficiency, and return on investment are computed the same way and reflected on the Analytics and Fuel pages.
 
### CSV Export
The Analytics page supports a client-side CSV export of the per-vehicle cost breakdown.
 
## Notes
 
Dark mode is the default appearance rather than a toggleable option. PDF export, automated email reminders for expiring licenses, and document management were left out of this build to keep scope within the hackathon time window; CSV export and the core RBAC, validation, and state-machine rules were prioritized as the mandatory business rules.
