# REST API Test Plan & Endpoint Specifications

This document outlines the API test plan, input payloads, expected status codes, response schemas, and failure test cases for all backend REST endpoints in the **Matrick Manufacturing System (MMS)**.

---

## 1. Authentication APIs (`/api/auth`)

### 1.1 Register Account (`POST /api/auth/register`)
- **Input Payload**:
  ```json
  {
    "name": "Jane Operator",
    "email": "jane.operator@matrick.com",
    "password": "Password123!",
    "role": "operator"
  }
  ```
- **Expected Success**: HTTP 201 Created with `{ success: true, data: { user, token } }`.
- **Failure Cases**:
  - Missing name/email/password ➔ HTTP 400 Bad Request (`MISSING_FIELDS`).
  - Duplicate email ➔ HTTP 409 Conflict (`USER_ALREADY_EXISTS`).

### 1.2 Login (`POST /api/auth/login`)
- **Input Payload**:
  ```json
  {
    "email": "admin@matrick.com",
    "password": "Password123!"
  }
  ```
- **Expected Success**: HTTP 200 OK with `{ success: true, data: { user, token } }`.
- **Failure Cases**:
  - Invalid credentials ➔ HTTP 401 Unauthorized (`INVALID_CREDENTIALS`).

### 1.3 Forgot Password OTP (`POST /api/auth/forgot-password`)
- **Input Payload**: `{ "email": "admin@matrick.com" }`
- **Expected Success**: HTTP 200 OK. Generates 6-digit OTP, saves hash in database, dispatches reset email.

### 1.4 Verify OTP (`POST /api/auth/verify-otp`)
- **Input Payload**: `{ "email": "admin@matrick.com", "otp": "123456" }`
- **Expected Success**: HTTP 200 OK with `{ success: true, message: "OTP verified successfully" }`.
- **Failure Cases**:
  - Incorrect OTP ➔ HTTP 400 Bad Request (`INVALID_OTP`).
  - Expired OTP (>15 mins) ➔ HTTP 400 Bad Request (`OTP_EXPIRED`).

### 1.5 Reset Password (`POST /api/auth/reset-password`)
- **Input Payload**: `{ "email": "admin@matrick.com", "otp": "123456", "newPassword": "NewPassword123!" }`
- **Expected Success**: HTTP 200 OK. Password updated with new bcrypt hash.

---

## 2. Product Master APIs (`/api/products`)

### 2.1 Get Catalog (`GET /api/products`)
- **Query Params**: `category=raw_material`, `search=Oak`, `page=1`, `limit=20`
- **Expected Success**: HTTP 200 OK with product array.

### 2.2 Create Product (`POST /api/products`)
- **Input Payload**:
  ```json
  {
    "name": "Aluminum Tube 50mm",
    "sku": "RM-ALU-005",
    "category": "raw_material",
    "unitOfMeasure": "pcs",
    "stockOnHand": 100,
    "minStockLevel": 25,
    "costPrice": 18.50
  }
  ```
- **Expected Success**: HTTP 201 Created.

---

## 3. Bill of Materials APIs (`/api/boms`)

### 3.1 Get BOMs (`GET /api/boms`)
- **Expected Success**: HTTP 200 OK with populated product and work center references.

### 3.2 Create BOM (`POST /api/boms`)
- **Input Payload**:
  ```json
  {
    "code": "BOM-ALU-001",
    "finishedProduct": "<PRODUCT_ID>",
    "quantity": 1,
    "version": "1.0",
    "components": [
      { "product": "<RAW_MATERIAL_ID>", "quantity": 2, "unitOfMeasure": "pcs" }
    ],
    "operations": [
      { "sequence": 1, "name": "Frame Cutting", "workCenter": "<WORKCENTER_ID>", "durationMinutes": 30 }
    ]
  }
  ```
- **Expected Success**: HTTP 201 Created.

---

## 4. Manufacturing Order APIs (`/api/manufacturing-orders`)

### 4.1 Create MO (`POST /api/manufacturing-orders`)
- **Input Payload**:
  ```json
  {
    "finishedProduct": "<PRODUCT_ID>",
    "bom": "<BOM_ID>",
    "quantity": 10,
    "priority": "high",
    "plannedStartDate": "2026-08-08"
  }
  ```
- **Expected Success**: HTTP 201 Created. Automatically checks component stock levels and calculates `componentRequirements`.

### 4.2 Update Status (`PATCH /api/manufacturing-orders/:id/status`)
- **Input Payload**: `{ "status": "confirmed" }`
- **Expected Success**: HTTP 200 OK. Auto-generates initial Work Orders for each operation defined in BOM.

---

## 5. Work Order Execution APIs (`/api/work-orders`)

### 5.1 Update Work Order Status (`PATCH /api/work-orders/:id/status`)
- **Input Payload**: `{ "status": "in_progress" }` or `{ "status": "completed", "actualDurationMinutes": 35 }`
- **Expected Success**: HTTP 200 OK. Emits Socket.IO update (`manufacturing:work-order:completed`). Completing operation unlocks next WO sequence.

---

## 6. Stock Ledger APIs (`/api/stock-ledger`)

### 6.1 Get Audit History (`GET /api/stock-ledger`)
- **Expected Success**: HTTP 200 OK with array of stock movements (`IN`, `RAW_MATERIAL_CONSUMPTION`, `FINISHED_GOODS_PRODUCTION`).

---

## 7. Analytics & Export APIs (`/api/manufacturing-workflow`)

### 7.1 Dashboard Summary (`GET /api/manufacturing-workflow/dashboard-summary`)
- **Expected Success**: HTTP 200 OK with `{ totalMOs, activeMOs, completedMOs, lowStockCount, workCenterUtilizationRate }`.

### 7.2 Export CSV Report (`GET /api/manufacturing-workflow/reports/export-csv`)
- **Expected Success**: HTTP 200 OK with `Content-Type: text/csv` header and streamed CSV data.
