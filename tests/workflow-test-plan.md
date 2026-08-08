# Manufacturing Business Workflow Test Plan

This document details the step-by-step test plan for validating the complete discrete manufacturing lifecycle in the **Matrick Manufacturing System (MMS)**.

---

## 🔄 Lifecycle Execution Flow

```
1. Create Product ➔ 2. Create BOM ➔ 3. Issue MO ➔ 4. Generate WOs ➔ 5. Execute Operations ➔ 6. Consume Materials ➔ 7. Produce Finished Goods ➔ 8. Audit Ledger & Analytics
```

---

## Detailed Step-by-Step Validation Script

### Step 1: Catalog Raw Materials & Finished Product
- **Action**: Create two Raw Materials (`Oak Legs`, `Teak Panel`) and one Finished Good (`Executive Desk`).
- **Inputs**:
  - `RM-LEG-101`: Stock = 100 pcs, Cost = $12.50
  - `RM-TOP-102`: Stock = 50 pcs, Cost = $48.00
  - `FP-TAB-001`: Stock = 0 pcs, Selling Price = $380.00
- **Expected Outcome**: All items registered in Product Master with safety thresholds set.

### Step 2: Engineer Bill of Materials (BOM)
- **Action**: Create BOM `BOM-TAB-001` for `FP-TAB-001` (Executive Desk).
- **Structure**:
  - Component 1: `RM-LEG-101` (4 pcs per 1 Desk)
  - Component 2: `RM-TOP-102` (1 pcs per 1 Desk)
  - Operation 1: Frame Assembly at `WC-ASM-02` (Planned 45 mins)
  - Operation 2: Sanding & Polish at `WC-PNT-03` (Planned 30 mins)
  - Operation 3: Quality Check & Boxing at `WC-PKG-04` (Planned 15 mins)
- **Expected Outcome**: BOM created and linked to finished product and work centers.

### Step 3: Issue & Confirm Manufacturing Order (MO)
- **Action**: Create Manufacturing Order `MO-2026-001` for 5 pcs of Executive Desks.
- **System Action**:
  - Calculates material needs: 20 Oak Legs (4*5) and 5 Teak Panels (1*5).
  - Validates stock availability: 100 legs >= 20 required (Available ✅); 50 panels >= 5 required (Available ✅).
  - Updates status to `confirmed`.
- **Expected Outcome**: Component availability status set to `available`. Initial Work Orders generated.

### Step 4: Execute Sequential Work Orders on Shop Floor
- **Action**:
  - Operator opens `MO-2026-001-WO-01` (Frame Assembly) ➔ Clicks **Start**. Status = `in_progress`.
  - Operator completes assembly ➔ Clicks **Complete**. Status = `completed`.
  - System automatically unlocks `MO-2026-001-WO-02` (Sanding & Polish).
  - Operator completes WO-02 and WO-03 sequentially.
- **Expected Outcome**: Operations executed in exact sequence; actual duration logged.

### Step 5: Raw Material Consumption & Finished Goods Posting
- **System Action**:
  - Deducts 20 units of `RM-LEG-101` (Stock: 100 ➔ 80 pcs).
  - Deducts 5 units of `RM-TOP-102` (Stock: 50 ➔ 45 pcs).
  - Credits 5 units of `FP-TAB-001` (Stock: 0 ➔ 5 pcs).
  - Updates MO status to `completed`.
  - Logs transactions in Stock Ledger (`RAW_MATERIAL_CONSUMPTION` and `FINISHED_GOODS_PRODUCTION`).
- **Expected Outcome**: Inventory updated; immutable audit ledger entries generated.

### Step 6: Review Analytics & Export Operational Report
- **Action**:
  - Open Dashboard: Active MO count decreases; Completed MO count increments.
  - Open Work Center Utilization chart: `WC-ASM-02`, `WC-PNT-03`, and `WC-PKG-04` display updated runtime hours.
  - Export CSV Report: Verify output matches executed production metrics.
- **Expected Outcome**: Real-time KPI charts and report files accurately reflect executed production batch.
