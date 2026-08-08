# Frontend UI Test Plan & Component Validation

This document defines user interface test cases, interaction flows, form state validation, charts, notifications, and real-time Socket.IO synchronization for the **Matrick Manufacturing System (MMS)** client application.

---

## 1. Authentication & Layout Navigation
- **TC-FE-AUTH-01: Login Form & JWT Token Storage**
  - *Steps*: Navigate to `/login` ➔ Enter `admin@matrick.com` / `Password123!` ➔ Click Login.
  - *Expected Outcome*: JWT token saved in `localStorage`; redirected to Dashboard `/`. Navbar displays user identity and role badge.
- **TC-FE-AUTH-02: Forgot Password Modal & OTP Input**
  - *Steps*: Click "Forgot Password?" on login screen ➔ Submit email ➔ Enter 6-digit OTP ➔ Set new password.
  - *Expected Outcome*: Modal transitions through email -> OTP verification -> password reset state smoothly. Success alert shown upon password update.
- **TC-FE-AUTH-03: Protected Route Redirect**
  - *Steps*: Clear `localStorage` ➔ Attempt accessing `/manufacturing-orders`.
  - *Expected Outcome*: User automatically redirected to `/login`.

---

## 2. Dashboard & KPI Visualizations
- **TC-FE-DASH-01: KPI Summary Counters**
  - *Steps*: Open `/` as authenticated user.
  - *Expected Outcome*: Renders Active MOs, Completed Orders, Work Centers Count, and Low Stock Alerts.
- **TC-FE-DASH-02: Work Center Utilization Chart**
  - *Steps*: View Work Center utilization bar chart.
  - *Expected Outcome*: Recharts renders utilization percentages per work center smoothly.

---

## 3. Product Catalog & BOM Management
- **TC-FE-PROD-01: Product Filtering & Search**
  - *Steps*: Navigate to `/products` ➔ Select filter "Raw Materials" ➔ Type "Oak" into search bar.
  - *Expected Outcome*: Table updates instantly, displaying only matching raw material items.
- **TC-FE-BOM-01: Multi-Component BOM Creator**
  - *Steps*: Navigate to `/boms/new` ➔ Select finished product ➔ Add 2 raw materials ➔ Add 2 sequence operations ➔ Submit form.
  - *Expected Outcome*: Creates new BOM and redirects to BOM list page.

---

## 4. Manufacturing Order & Work Order Execution
- **TC-FE-MO-01: MO Creation & Material Availability Indicator**
  - *Steps*: Navigate to `/manufacturing-orders/new` ➔ Select product & quantity ➔ Review stock validation widget.
  - *Expected Outcome*: Stock check widget turns green when stock is sufficient (`sufficientStock: true`) or red when stock is lacking.
- **TC-FE-WO-01: Shop Floor Work Order Timer Execution**
  - *Steps*: Navigate to `/work-orders` ➔ Click "Start Operation" on WO-01 ➔ Observe real-time duration counter.
  - *Expected Outcome*: Status badge switches to `In Progress`. Timer increments duration seconds. Click "Complete Operation" ➔ Status badge switches to `Completed` and unlocks WO-02.

---

## 5. Stock Ledger & Export Tools
- **TC-FE-STOCK-01: Audit Movement History**
  - *Steps*: Navigate to `/stock-ledger`.
  - *Expected Outcome*: Displays chronological ledger entries with transaction badges (`RAW_MATERIAL_CONSUMPTION`, `FINISHED_GOODS_PRODUCTION`).
- **TC-FE-REP-01: CSV Export Download**
  - *Steps*: Navigate to `/reports` ➔ Click "Export CSV Report".
  - *Expected Outcome*: Triggers browser download of `mms-manufacturing-report.csv`.

---

## 6. Real-Time Notification Center
- **TC-FE-NOTIF-01: Socket.IO Event Listener & Badge Counter**
  - *Steps*: Open Manager Dashboard in Window A and Operator Work Order execution in Window B. Complete a Work Order in Window B.
  - *Expected Outcome*: Notification bell icon in Window A displays red unread badge (`1`). Opening Notification Center shows "Work Order Completed" notification item without page reload.
