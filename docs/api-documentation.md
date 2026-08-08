# Matrick Manufacturing System - REST API Specifications

This document provides formal technical documentation for all backend HTTP endpoints implemented in the **Matrick Manufacturing System (MMS)** API.

---

## 🔐 Base URL & Headers

- **Base URL**: `http://localhost:3000/api`
- **Content Type**: `application/json`
- **Authentication**: Bearer Token in `Authorization` header (`Authorization: Bearer <jwt_token>`).

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register User Account
- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Purpose**: Registers a new user account (Operator, Manager, Inspector, Admin).
- **Request Example**:
```json
{
  "name": "John Operator",
  "email": "john.operator@matrick.com",
  "password": "Password123!",
  "role": "operator"
}
```
- **Response Example (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "66b1a2c3d4e5f67890123456",
      "name": "John Operator",
      "email": "john.operator@matrick.com",
      "role": "operator"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 User Login
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Purpose**: Authenticates user credentials and returns JWT session token.
- **Request Example**:
```json
{
  "email": "admin@matrick.com",
  "password": "Password123!"
}
```
- **Response Example (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "66b1a2c3d4e5f67890123450",
      "name": "System Administrator",
      "email": "admin@matrick.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 Get Current User Profile
- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Header**: `Authorization: Bearer <token>`
- **Response Example (200 OK)**:
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "_id": "66b1a2c3d4e5f67890123450",
      "name": "System Administrator",
      "email": "admin@matrick.com",
      "role": "admin"
    }
  }
}
```

---

## 2. Product Master Endpoints (`/api/products`)

### 2.1 Get All Products
- **Method**: `GET`
- **URL**: `/api/products`
- **Query Parameters**: `category`, `search`, `page`, `limit`
- **Response Example (200 OK)**:
```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": [
    {
      "_id": "66b1a2c3d4e5f67890123457",
      "name": "Wooden Executive Table",
      "sku": "FP-TAB-001",
      "category": "finished_goods",
      "unitOfMeasure": "pcs",
      "stockOnHand": 25,
      "minStockLevel": 5,
      "costPrice": 115.00,
      "sellingPrice": 380.00
    }
  ]
}
```

### 2.2 Create New Product
- **Method**: `POST`
- **URL**: `/api/products`
- **Request Example**:
```json
{
  "name": "Teak Wood Panel",
  "sku": "RM-TEAK-100",
  "category": "raw_material",
  "unitOfMeasure": "pcs",
  "stockOnHand": 100,
  "minStockLevel": 20,
  "costPrice": 45.00
}
```
- **Response Example (201 Created)**:
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "66b1a2c3d4e5f67890123458",
    "name": "Teak Wood Panel",
    "sku": "RM-TEAK-100",
    "category": "raw_material",
    "stockOnHand": 100
  }
}
```

---

## 3. Bill of Materials (BOM) Endpoints (`/api/boms`)

### 3.1 Get All BOMs
- **Method**: `GET`
- **URL**: `/api/boms`
- **Response Example (200 OK)**:
```json
{
  "success": true,
  "message": "BOMs fetched successfully",
  "data": [
    {
      "_id": "66b1a2c3d4e5f67890123460",
      "code": "BOM-TAB-001",
      "finishedProduct": {
        "_id": "66b1a2c3d4e5f67890123457",
        "name": "Wooden Executive Table",
        "sku": "FP-TAB-001"
      },
      "quantity": 1,
      "version": "1.0",
      "components": [
        { "product": "66b1a2c3d4e5f67890123451", "quantity": 4, "unitOfMeasure": "pcs" }
      ],
      "operations": [
        { "sequence": 1, "name": "Assembly", "durationMinutes": 45 }
      ]
    }
  ]
}
```

### 3.2 Create BOM Structure
- **Method**: `POST`
- **URL**: `/api/boms`
- **Request Example**:
```json
{
  "code": "BOM-TAB-001",
  "finishedProduct": "66b1a2c3d4e5f67890123457",
  "quantity": 1,
  "version": "1.0",
  "components": [
    { "product": "66b1a2c3d4e5f67890123451", "quantity": 4, "unitOfMeasure": "pcs" }
  ],
  "operations": [
    { "sequence": 1, "name": "Assembly", "workCenter": "66b1a2c3d4e5f67890123455", "durationMinutes": 45 }
  ]
}
```

---

## 4. Manufacturing Orders (`/api/manufacturing-orders`)

### 4.1 Get All Manufacturing Orders
- **Method**: `GET`
- **URL**: `/api/manufacturing-orders`
- **Query Parameters**: `status`, `priority`, `search`
- **Response Example (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "66b1a2c3d4e5f67890123470",
      "moNumber": "MO-2026-001",
      "finishedProduct": "66b1a2c3d4e5f67890123457",
      "quantity": 10,
      "status": "in_progress",
      "priority": "high",
      "componentAvailabilityStatus": "available"
    }
  ]
}
```

### 4.2 Update Manufacturing Order Status
- **Method**: `PATCH`
- **URL**: `/api/manufacturing-orders/:id/status`
- **Request Example**:
```json
{
  "status": "confirmed"
}
```
- **Response Example (200 OK)**:
```json
{
  "success": true,
  "message": "Manufacturing order status updated successfully",
  "data": {
    "_id": "66b1a2c3d4e5f67890123470",
    "moNumber": "MO-2026-001",
    "status": "confirmed"
  }
}
```

---

## 5. Work Orders (`/api/work-orders`)

### 5.1 Get Work Orders
- **Method**: `GET`
- **URL**: `/api/work-orders`
- **Query Parameters**: `manufacturingOrder`, `status`, `workCenter`

### 5.2 Update Work Order Status (Start / Pause / Complete)
- **Method**: `PATCH`
- **URL**: `/api/work-orders/:id/status`
- **Request Example**:
```json
{
  "status": "completed",
  "actualDurationMinutes": 42
}
```

---

## 6. Stock Ledger (`/api/stock-ledger`)

### 6.1 Get Stock Transaction History
- **Method**: `GET`
- **URL**: `/api/stock-ledger`
- **Query Parameters**: `product`, `movementType`, `startDate`, `endDate`

### 6.2 Manual Stock Adjustment
- **Method**: `POST`
- **URL**: `/api/stock-ledger/adjust`
- **Request Example**:
```json
{
  "product": "66b1a2c3d4e5f67890123457",
  "movementType": "IN",
  "quantity": 50,
  "reason": "Supplier shipment receipt"
}
```

---

## 7. Dashboard & Reports (`/api/manufacturing-workflow`)

### 7.1 Dashboard KPI Summary
- **Method**: `GET`
- **URL**: `/api/manufacturing-workflow/dashboard-summary`
- **Response Example (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalMOs": 3,
    "activeMOs": 1,
    "completedMOs": 0,
    "lowStockCount": 0,
    "workCenterUtilizationRate": 78.5
  }
}
```

### 7.2 Export CSV Report
- **Method**: `GET`
- **URL**: `/api/manufacturing-workflow/reports/export-csv`
