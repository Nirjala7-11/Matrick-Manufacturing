# Matrick Manufacturing System (MMS)

> Enterprise-Grade Shop Floor Execution, Bill of Materials (BOM), Inventory Control & Real-Time Analytics Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19.0-61dafb)](https://react.dev/)
[![Docker Compliant](https://img.shields.io/badge/Docker-Multi--Stage-2496ed)](https://www.docker.com/)

---

## 📌 Problem Statement Summary

Modern discrete manufacturing enterprises struggle with disjointed shop floor visibility, manual inventory tracking errors, delayed Work Order (WO) execution updates, and complex Bill of Materials (BOM) management. Legacy ERP systems are frequently rigid, expensive, and lack real-time synchronization between operators on the shop floor and managers in the central office.

---

## 💡 Solution Overview

The **Matrick Manufacturing System (MMS)** bridges the gap between ERP planning and shop floor execution. Inspired by Odoo Manufacturing, MMS delivers a lightweight, real-time, event-driven web application that manages the full manufacturing lifecycle:

`Product Master ➔ Bill of Materials (BOM) ➔ Manufacturing Order (MO) ➔ Work Orders (WO) ➔ Work Center Execution ➔ Stock Ledger Audit ➔ Real-Time Analytics & Reports`

---

## ✨ Key Features

- **Product Master Management**: Catalog raw materials, components, assemblies, and finished goods with SKU tracking, minimum safety thresholds, and unit costs.
- **Multi-Level BOM Engineering**: Define component quantities, waste ratios, and sequential routing operations mapped to specific work centers.
- **Manufacturing Order Execution**: Create, confirm, and launch MOs with automatic raw material availability validation and component allocation.
- **Interactive Shop Floor Work Orders**: Timed operation execution (Start, Pause, Resume, Complete) for shop floor operators with live duration tracking and bottleneck warnings.
- **Automated Stock Ledger & Inventory**: Auto-consume raw materials upon WO/MO progress and auto-credit finished goods to stock upon completion with full transaction audit trails.
- **Real-Time WebSockets**: Live status updates across all connected user sessions via Socket.IO whenever MOs, Work Orders, or inventory levels change.
- **Analytics & Exportable Reports**: Visual KPI dashboards, Work Center capacity utilization metrics, stock movement velocity, and CSV/PDF report generation.
- **Role-Based Access Control (RBAC)**: Secure JWT authentication supporting `admin`, `manager`, `operator`, and `quality_inspector` access tiers.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React, Recharts | Fast SPA, responsive UI, charts & dashboard visuals |
| **Backend** | Node.js v20, Express 4/5, Socket.IO | REST API gateway & real-time WebSocket engine |
| **Database** | MongoDB 7.0, Mongoose ORM | Document storage for BOMs, MOs, WOs & stock ledger |
| **Containerization** | Docker, Docker Compose, Nginx | Multi-stage container builds & reverse proxy routing |
| **Authentication** | JWT, BcryptJS, Express Rate Limit | Encrypted token authentication & rate-limited endpoints |

---

## 📐 Architecture Overview

MMS uses a decoupled client-server architecture with an integrated Nginx gateway and MongoDB database.

```
+-----------------------------------------------------------------------+
|                             Nginx Gateway                             |
|                               (Port 80)                               |
+-----------------------------------┬-----------------------------------+
                                    |
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│   React 19 SPA    │     │   Express REST    │     │   Socket.IO WS    │
│  (Port 8080/Vite) │     │    (Port 5000)    │     │    (Port 5000)    │
└───────────────────┘     └─────────┬─────────┘     └───────────────────┘
                                    │
                                    ▼
                          ┌───────────────────┐
                          │ MongoDB Database  │
                          │   (Port 27017)    │
                          └───────────────────┘
```

Detailed architectural blueprints are available in [`docs/architecture.md`](docs/architecture.md).

---

## 🔄 Application Business Workflow

1. **Define Products**: Create raw materials (`RM-LEG-101`), components (`CM-SCR-103`), and finished products (`FP-TAB-001`).
2. **Configure Work Centers**: Setup machinery and labor stations (e.g., `WC-ASM-02` Assembly Line).
3. **Build BOM**: Map required raw materials and routing steps to finished products.
4. **Issue Manufacturing Order**: Create MO (`MO-2026-001`) specifying product and target quantity. System checks component availability.
5. **Execute Work Orders**: Shop floor operators launch sequential Work Orders (`MO-2026-001-WO-01`), tracking actual time spent.
6. **Stock Consumption & Production Output**: Raw materials are deducted from inventory upon consumption; finished goods are credited to stock upon MO completion.
7. **Analyze & Export**: Review production KPIs, machine utilization rates, and export summary reports.

Detailed workflow diagrams are available in [`docs/workflow.md`](docs/workflow.md).

---

## 🧩 Core Modules

- **Dashboard**: Real-time KPI summaries, active MO counts, low-stock alerts, and quick actions.
- **Product Master**: Searchable inventory list with filtering by category (`raw_material`, `finished_goods`, `component`, `assembly`).
- **Bill of Materials**: Structural hierarchy editor for components and sequence operations.
- **Manufacturing Orders**: Production order lifecycle controller (`draft` ➔ `confirmed` ➔ `in_progress` ➔ `completed`).
- **Work Orders**: Shop floor operator portal with timer controls and work center status monitors.
- **Work Centers**: Capacity and hourly cost tracking per machine/station.
- **Stock Ledger**: Immutable audit log of every stock `IN`, `OUT`, `RAW_MATERIAL_CONSUMPTION`, and `FINISHED_GOODS_PRODUCTION`.
- **Analytics & Reports**: Interactive charts (Recharts) and export tools for operational compliance.

---

## 🖼️ Application Screenshots

*(Place screenshots here)*

- **Dashboard Overview**: `assets/screenshots/dashboard.png`
- **Shop Floor Work Order Execution**: `assets/screenshots/work-orders.png`
- **Stock Ledger & Movement History**: `assets/screenshots/stock-ledger.png`

---

## 🚀 Installation & Local Setup

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB Server >= 7.0 (or local Docker container)

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/matrick/matrick-manufacturing-system.git
cd matrick-manufacturing-system

# Install dependencies
npm install
```

### Step 2: Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

Ensure `.env` matches your MongoDB connection string and JWT configuration:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/mms_db
JWT_SECRET=production_jwt_secret_matrick_manufacturing_2026
```

### Step 3: Seed Database with Demo Data
Run the automated seed script to populate demo users, products, work centers, BOMs, MOs, and stock movements:
```bash
npm run seed
```

### Step 4: Run Application locally
Start the full-stack development environment:
```bash
npm run dev
```

Open browser at `http://localhost:3000`.

---

## 🐳 Docker Deployment

Run the complete multi-container stack (Nginx + Frontend + Backend + MongoDB):

```bash
# Build and launch containers
docker compose up -d --build

# Verify container health
docker compose ps
```

The application is accessible at `http://localhost`.

Detailed deployment steps are available in [`docs/deployment.md`](docs/deployment.md).

---

## 🔒 Demo User Credentials

The database seeder provisions four pre-configured user accounts:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@matrick.com` | `Password123!` | Full system administration & user access |
| **Manager** | `manager@matrick.com` | `Password123!` | MO/BOM creation, reports, inventory control |
| **Operator** | `operator@matrick.com` | `Password123!` | Work Order timer execution & shop floor updates |
| **Inspector** | `inspector@matrick.com` | `Password123!` | Quality control and inspection audits |

---

## 📡 API Reference Overview

Key REST API routes:

- `POST /api/auth/login` - Authenticate user & get JWT token
- `POST /api/auth/register` - Create new operator account
- `GET /api/products` - List inventory catalog
- `GET /api/boms` - Fetch BOM list
- `POST /api/manufacturing-orders` - Create new MO
- `PATCH /api/work-orders/:id/status` - Update WO status (start/pause/complete)
- `GET /api/stock-ledger` - View stock transaction history

Full API specifications are available in [`docs/api-documentation.md`](docs/api-documentation.md).

---

## 🔮 Future Scalability

1. **Quality Control (QC) Gates**: Mandatory hold and release checkpoints during WO execution.
2. **Preventive Maintenance**: Automated work center downtime schedules based on runtime hours.
3. **Barcoding / QR Scanning**: Instant material picking and WO check-ins via mobile scanners.
4. **Multi-Plant Support**: Hierarchical inventory segregation across geographically distributed facilities.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
