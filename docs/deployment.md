# Matrick Manufacturing System - Production Deployment Guide

This document outlines the containerized deployment setup, environment configuration, database management, and operational procedures for the **Matrick Manufacturing System**.

---

## 1. Architecture Overview

The system is deployed using a decoupled, microservices-ready containerized structure managed by **Docker Compose** or single-container Cloud Run runners:

- **Nginx Gateway (`mms_proxy`)**: Listens on Port 80/443. Acts as the primary reverse proxy routing `/` to the frontend, `/api/` to the backend Express REST API, and `/socket.io/` to WebSocket streams.
- **Frontend SPA (`mms_frontend`)**: Lightweight Nginx container serving compiled React 19 / Vite production static assets.
- **Backend API Engine (`mms_backend`)**: Node.js Express server handling manufacturing logic, MongoDB ORM transactions, PDF/Excel generation, and Socket.IO realtime broadcasts.
- **MongoDB Database (`mms_mongodb`)**: Persistent Mongo 7.0 database storing products, BOMs, MOs, Work Orders, inventory ledgers, users, and audit logs.

```
                  ┌────────────────────────────────────────┐
                  │          Nginx Reverse Proxy           │
                  │              (Port 80)                 │
                  └──────────────────┬─────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
 ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
 │   Frontend SPA    │     │   Backend API     │     │   Socket.IO WS    │
 │ (React/Vite 8080) │     │  (Express 5000)   │     │  (Realtime 5000)  │
 └───────────────────┘     └─────────┬─────────┘     └───────────────────┘
                                     │
                                     ▼
                           ┌───────────────────┐
                           │ MongoDB Database  │
                           │    (Port 27017)   │
                           └───────────────────┘
```

---

## 2. Environment Setup

Copy `.env.example` to `.env` in the root directory prior to launching the stack:

```bash
cp .env.example .env
```

### Production Environment Variables Table

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Node execution mode |
| `PORT` | `3000` or `5000` | Express HTTP server port |
| `HTTP_PORT` | `80` | External Nginx gateway port |
| `FRONTEND_PORT` | `8080` | Internal React container port |
| `BACKEND_PORT` | `5000` | Internal Node container port |
| `MONGO_PORT` | `27017` | MongoDB host exposed port |
| `MONGO_INITDB_ROOT_USERNAME` | `admin` | MongoDB root user |
| `MONGO_INITDB_ROOT_PASSWORD` | `adminpassword` | MongoDB root password |
| `MONGO_INITDB_DATABASE` | `mms_db` | Primary database name |
| `JWT_SECRET` | `change_me_in_prod` | 256-bit secret key for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | Authentication token validity duration |
| `CLIENT_URL` | `http://localhost` | Allowed CORS origin URL |

---

## 3. Docker Installation

Ensure Docker Engine (>= 24.0.0) and Docker Compose (>= 2.20.0) are installed:

```bash
# Verify Docker Installation
docker --version
docker compose version
```

---

## 4. Running Locally with Docker Compose

To build and start all four containers in detached mode:

```bash
# Start container stack
docker compose up -d --build

# Inspect running container health
docker compose ps

# Tail runtime logs
docker compose logs -f
```

Access the application in your browser:
- **Application Portal**: `http://localhost`
- **Backend API Health Check**: `http://localhost/api/health`

To stop the container stack:

```bash
docker compose down
```

To wipe persistent database volumes (Warning: destructive):

```bash
docker compose down -v
```

---

## 5. Production Deployment Steps

### Option A: Standard Single Server (Docker Compose)
1. Clone the codebase to the production server.
2. Configure `.env` with strong passwords and JWT secrets.
3. Run `docker compose up -d --build`.
4. Configure an SSL certificate using certbot / Let's Encrypt on Port 443.

### Option B: Cloud Run / Unified Container Execution
Build the root multi-stage Dockerfile which packages the express server and static client:

```bash
# Build image
docker build -t matrick-mms:latest .

# Run container
docker run -p 3000:3000 --env-file .env matrick-mms:latest
```

---

## 6. MongoDB Configuration & Persistence

- **Data Persistence**: Stored inside Docker volume `mongodb_data` mapped to `/data/db`.
- **Database Seeding**: To seed default admin users, raw materials, work centers, and demo BOMs:

```bash
# Execute seed inside the backend container
docker compose exec backend npm run seed
```

---

## 7. Frontend / Backend Communication

- In production, client API calls are directed to `/api` relative path.
- Nginx proxies these transparently to `http://backend:5000/api/` stripping CORS issues.
- Client requests utilize Axios with `Authorization: Bearer <token>` headers attached automatically.

---

## 8. Socket.IO Realtime Configuration

- Socket.IO connects via standard HTTP upgrade requests to `/socket.io/`.
- Nginx handles WebSocket headers (`Upgrade: websocket`, `Connection: Upgrade`) and extends proxy read timeouts to `86400s`.
- Real-time events broadcasted automatically:
  - `mo:created`, `mo:updated`
  - `wo:status_changed`, `wo:progress_updated`
  - `stock:updated`, `inventory:movement`
  - `analytics:refreshed`

---

## 9. Troubleshooting & Health Monitoring

### Healthcheck Endpoints
- **Proxy/Backend**: `http://localhost/health` or `http://localhost/api/health`
- **Frontend Container**: `http://localhost:8080/healthz`

### Diagnostic Commands

```bash
# Check backend health log
docker compose exec backend node healthcheck.js; echo $?

# View container resource usage
docker stats

# Inspect database connections
docker compose exec mongodb mongosh -u admin -p adminpassword --eval "db.serverStatus().connections"
```

---

## 10. Future Module Scalability

The container infrastructure uses an extendable modular layout allowing future additions (Quality Inspection, Maintenance, Purchasing, Supplier Portals) without structural re-engineering.
