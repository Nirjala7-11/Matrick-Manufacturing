# Manufacturing Business Workflow Guide

This document explains the end-to-end manufacturing workflow implemented in the **Matrick Manufacturing System (MMS)**, from initial product cataloging to shop floor work order execution and stock ledger accounting.

---

## 🔄 End-to-End Workflow Diagram

```
[Product Master]
       │
       ▼
[Bill of Materials (BOM)]
       │
       ▼
[Manufacturing Order (MO)]
       │
       ▼
[Work Orders (WO)] ──► [Work Center Execution]
       │
       ▼
[Stock Ledger Audit] ──► [Finished Goods Output]
```

---

## 1. Product Master Cataloging

Before manufacturing can occur, items must be defined in the Product Master:

- **Categories**:
  - `raw_material`: Unprocessed inputs (e.g., Oak Wood Logs, Teak Wood Panels).
  - `component`: Pre-fabricated parts (e.g., Screws, Swivel Casters, Cushions).
  - `assembly`: Sub-assemblies built in-house.
  - `finished_goods`: Final salable products (e.g., Executive Tables, Office Chairs).
- **Stock Parameters**: Stock on Hand, Minimum Stock Threshold, Cost Price, Selling Price, Unit of Measure (`pcs`, `kg`, `liter`, `box`).

---

## 2. Bill of Materials (BOM) Engineering

A **Bill of Materials (BOM)** is the master blueprint for producing a finished good. It defines:

1. **Header**:
   - Finished Product reference (e.g., `Wooden Executive Table`).
   - Base output quantity (e.g., `1 pcs`).
   - Version number (e.g., `1.0`).
2. **Components**:
   - Required raw material / component references.
   - Quantity required per unit output (e.g., 4 pcs of Oak Legs per 1 Table).
   - Unit of measure.
3. **Routing Operations**:
   - Sequential step sequence (`1`, `2`, `3`).
   - Operation name (e.g., `Frame Assembly`, `Sanding & Painting`, `Quality Check`).
   - Assigned Work Center (e.g., `WC-ASM-02`).
   - Planned duration in minutes.

---

## 3. Manufacturing Order (MO) Creation & Confirmation

A **Manufacturing Order (MO)** represents a planned production batch.

- **Attributes**:
  - Unique MO Number (e.g., `MO-2026-001`).
  - Target Finished Product & Selected BOM.
  - Planned Manufacturing Quantity (e.g., `10 pcs`).
  - Priority (`low`, `medium`, `high`, `urgent`).
  - Planned Start & Completion Dates.
- **Automated Stock Validation**:
  - When an MO is created or confirmed, the system calculates total required component quantities (`Quantity * Component Per Unit`).
  - System checks current stock levels and updates `componentAvailabilityStatus` (`available`, `partially_available`, `insufficient`).
- **Lifecycle Statuses**:
  - `draft`: Initial creation; requirements calculated but not scheduled.
  - `confirmed`: Order approved; raw materials reserved; Work Orders generated.
  - `in_progress`: Shop floor operations active.
  - `completed`: All operations finished; finished goods added to inventory.
  - `cancelled`: Order aborted.

---

## 4. Work Order (WO) Shop Floor Execution

When an MO is confirmed, the system generates sequential **Work Orders** corresponding to each BOM operation:

- **Work Order Structure**:
  - Unique WO Number (e.g., `MO-2026-001-WO-01`).
  - Sequence order (`1`, `2`, `3`).
  - Assigned Work Center & Operator.
  - Planned vs. Actual Duration in minutes.
- **Shop Floor Controls**:
  - **Start**: Moves WO to `in_progress` status and starts real-time timer.
  - **Pause**: Temporarily holds WO; records elapsed duration.
  - **Resume**: Restarts timer.
  - **Complete**: Finalizes WO; marks status as `completed`. Unlocks next sequential WO in the pipeline.

---

## 5. Stock Ledger & Inventory Accounting

Every material transaction is recorded in the immutable **Stock Ledger**:

1. **Raw Material Consumption (`RAW_MATERIAL_CONSUMPTION`)**:
   - Triggered when Work Orders consume raw materials or when an MO is completed.
   - Reduces stock on hand for components.
   - Logs `stockBefore`, `stockAfter`, `manufacturingOrder`, and `performedBy` user ID.
2. **Finished Goods Production (`FINISHED_GOODS_PRODUCTION`)**:
   - Triggered upon MO completion.
   - Increases stock on hand for the finished product.
   - Logs production completion details.
3. **Manual Adjustments / Purchase Receipts (`IN` / `OUT` / `ADJUSTMENT`)**:
   - Handles incoming supplier inventory receipts or inventory cycle count reconciliations.

---

## 6. Analytics & Real-Time Visibility

- **Real-time Synchronization**: Socket.IO broadcasts updates to all connected dashboards when MOs progress or inventory changes.
- **Analytics KPI Metrics**:
  - Total Active MOs and Work Orders.
  - Work Center Capacity Utilization Rate.
  - On-Time Completion Rate.
  - Stock Movement Velocity & Low-Stock Alerts.
