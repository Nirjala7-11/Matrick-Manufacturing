# Matrick Manufacturing System - Hackathon Demo Guide

> **Target Demo Duration**: 5 to 7 Minutes  
> **Audience**: Hackathon Judges, Technical Evaluators & Manufacturing Stakeholders

---

## 🎬 Pre-Demo Setup Checklist

1. Ensure MongoDB is running and seeded with demo data:
   ```bash
   npm run seed
   ```
2. Start the full-stack development server:
   ```bash
   npm run dev
   ```
3. Open browser windows at `http://localhost:3000`:
   - **Window A**: Manager View (`manager@matrick.com` / `Password123!`)
   - **Window B** (Incognito): Operator View (`operator@matrick.com` / `Password123!`)

---

## ⏱️ Step-by-Step Presentation Script

### Step 1: Login & Role Security (0:00 - 0:45)
- **Action**: Log in as `manager@matrick.com`.
- **Narration**: *"Welcome to the Matrick Manufacturing System. MMS is an enterprise-grade shop floor execution and BOM portal. Notice our secure JWT authentication supporting granular role-based access for Admins, Managers, Operators, and Inspectors."*

### Step 2: Executive Dashboard & KPIs (0:45 - 1:30)
- **Action**: Navigate to the **Dashboard** tab.
- **Showcase**:
  - Live KPI Cards: Active Manufacturing Orders, Low Stock Alerts, Total Work Centers.
  - Interactive Filters: Filter MOs by status (`in_progress`, `confirmed`, `draft`).
- **Narration**: *"The central dashboard gives managers real-time visibility into production efficiency, work center load, and low-stock warnings."*

### Step 3: Product Master Catalog (1:30 - 2:15)
- **Action**: Click **Products** ➔ Click **Create Product**.
- **Inputs**:
  - Name: `Oak Dining Bench`
  - SKU: `FP-BNC-003`
  - Category: `finished_goods`
  - Stock on Hand: `0`
  - Cost Price: `$45.00`
- **Narration**: *"Creating a product catalog entry defines inventory category rules, cost valuations, and reorder points."*

### Step 4: Bill of Materials (BOM) Setup (2:15 - 3:00)
- **Action**: Click **BOM** ➔ Click **Create BOM**.
- **Inputs**:
  - Code: `BOM-BNC-003`
  - Finished Product: `Oak Dining Bench`
  - Add Component: `Oak Wooden Legs` (4 pcs), `Teak Wood Tabletop` (1 pcs)
  - Add Operations: `Framing` (Assembly Station), `Polish Coating` (Sanding & Painting Bay)
- **Narration**: *"The BOM is our production blueprint—mapping raw materials and multi-stage work center operations."*

### Step 5: Manufacturing Order (MO) Creation (3:00 - 3:45)
- **Action**: Click **Manufacturing Orders** ➔ Click **Create Order**.
- **Inputs**:
  - Product: `Oak Dining Bench`
  - Quantity: `5 pcs`
  - Priority: `High`
- **Showcase**: Automated Raw Material Availability check (`sufficientStock: true`).
- **Narration**: *"When creating an MO, MMS automatically calculates component requirements against stock on hand and flags any inventory shortage before production starts."*

### Step 6: Shop Floor Work Order Execution (3:45 - 4:45)
- **Action**: Switch to **Window B** (Operator View as `operator@matrick.com`). Open **Work Orders**.
- **Action**: Find the Work Order for the new MO, click **Start**.
- **Showcase**: Real-time timer running (`actualDurationMinutes`). Click **Complete**.
- **Narration**: *"On the shop floor, operators use a simplified interface with built-in timers. Completing a work order unlocks downstream operations automatically."*

### Step 7: Automated Stock Ledger Accounting (4:45 - 5:15)
- **Action**: Switch back to Manager View (Window A). Click **Stock Ledger**.
- **Showcase**: Audit log showing `RAW_MATERIAL_CONSUMPTION` for Oak Legs and `FINISHED_GOODS_PRODUCTION` for Oak Dining Benches.
- **Narration**: *"MMS eliminates manual inventory logging. Material consumptions and finished goods output are automatically posted to an immutable audit ledger."*

### Step 8: Real-Time WebSockets Demonstration (5:15 - 5:45)
- **Action**: Place Window A and Window B side-by-side. Complete a Work Order in Window B.
- **Showcase**: Window A dashboard and stock counters update instantly without refreshing the page!
- **Narration**: *"Powered by Socket.IO, production progress updates propagate in real time to all connected managers and operators across the plant."*

### Step 9: Analytics & Report Generation (5:45 - 6:30)
- **Action**: Click **Analytics** ➔ Click **Export CSV Report**.
- **Showcase**: Recharts visual graphs for work center efficiency and download summary CSV.
- **Narration**: *"Managers can inspect capacity utilization charts and export compliance reports in one click."*

---

## 💡 Quick Tips for Presenters

1. **Keep it Moving**: Avoid lingering on form inputs; speak through the actions smoothly.
2. **Highlight Problem & Solution**: Emphasize how legacy paper job cards are replaced by real-time timers and automated stock ledgers.
3. **Show Split Screen**: The side-by-side WebSocket update always leaves a memorable impression on hackathon judges!
