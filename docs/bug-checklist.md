# Matrick Manufacturing System - Pre-Submission Bug & QA Checklist

This checklist tracks validation steps across authentication, core manufacturing modules, analytics, reporting, real-time web sockets, and deployment readiness.

---

## 🔐 1. Authentication & Security
- [x] Login works with seeded demo accounts (`admin`, `manager`, `operator`).
- [x] Invalid credentials return HTTP 401 with clear error message.
- [x] Protected routes reject requests without a valid `Authorization: Bearer <token>` header.
- [x] Forgot password flow generates 6-digit expiring OTP and dispatches email notification.
- [x] Password reset with valid OTP successfully updates password hash.
- [x] Sensitive user fields (`password`, `otpHash`) are omitted from API responses.

---

## 📦 2. Product Master & Inventory
- [x] Product creation enforces unique SKU constraint.
- [x] Category filtering works (`raw_material`, `component`, `assembly`, `finished_goods`).
- [x] Minimum safety stock levels trigger visual alerts on Dashboard.
- [x] Stock on Hand updates correctly during stock ledger movements.

---

## 📋 3. Bill of Materials (BOM)
- [x] BOM creation links finished goods to required raw materials and components.
- [x] Routing sequence operations link correctly to Work Centers.
- [x] Multiple BOM versions supported (`v1.0`, `v1.1`).

---

## ⚙️ 4. Manufacturing Orders (MO)
- [x] MO creation calculates component requirements (`Quantity * BOM Component Quantity`).
- [x] Component stock availability status correctly flags `available` or `insufficient`.
- [x] MO status transitions cleanly (`draft` ➔ `confirmed` ➔ `in_progress` ➔ `completed`).
- [x] Completing an MO automatically credits finished goods quantity to stock on hand.

---

## 🔨 5. Work Orders (WO)
- [x] Work Orders auto-generate upon MO confirmation based on BOM operations.
- [x] Timer controls (`Start`, `Pause`, `Resume`, `Complete`) record actual duration minutes.
- [x] Completing an operation unlocks the next sequential Work Order in line.
- [x] Completing work orders posts `RAW_MATERIAL_CONSUMPTION` logs to the Stock Ledger.

---

## 📊 6. Analytics & Reports
- [x] Dashboard KPI cards calculate active MOs, completed orders, and low-stock count.
- [x] Work Center capacity utilization metrics calculate correctly.
- [x] CSV report export endpoint streams valid CSV file.

---

## 📡 7. Real-Time WebSockets
- [x] Socket.IO authenticates clients via JWT token handshake.
- [x] Event `manufacturing:mo:created` updates Manager Dashboard instantly.
- [x] Event `manufacturing:work-order:completed` updates shop floor monitoring.
- [x] Socket client auto-reconnects gracefully on network interruption.

---

## 🐳 8. Deployment Readiness
- [x] Production Docker build succeeds without errors.
- [x] Nginx reverse proxy routes Port 80 to frontend SPA and `/api` to Express backend.
- [x] Environment variables declared in `.env.example`.
- [x] Database seed script (`npm run seed`) executes cleanly and idempotently.
