# Karibu Groceries Limited (KGL) — Management System

> A full-stack inventory, procurement, and sales management platform for a multi-branch agricultural produce trading company in Uganda.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [User Roles](#user-roles)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Branch Isolation](#branch-isolation)
- [Known Issues & Roadmap](#known-issues--roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Karibu Groceries Limited (KGL) trades agricultural produce — maize, beans, groundnuts, soya, and cow peas — across two branches: **Maganjo** and **Matugga**. This system digitizes the full supply chain from farm-gate procurement through warehouse storage to final sale, replacing paper-based ledgers with a live, role-secured web application.

Every kilogram of produce is tracked from the moment it enters the warehouse (procurement) to the moment it leaves (sale), with clear financial records, credit management, and branch-level analytics.

**Live backend:** `https://kgl-project-3g6j.onrender.com`

**API docs (Swagger UI):** `https://kgl-project-3g6j.onrender.com/api-docs`

---

## Features

| Area | What the system does |
|---|---|
| **Procurement** | Records stock purchases from suppliers with full supplier details, quantity, and cost |
| **Inventory** | Tracks real-time stock levels per branch; auto-updates on every procurement and sale |
| **Pricing** | Branch managers set per-product selling prices; enforced server-side on every sale |
| **Sales** | Supports both cash and credit transactions; pricePerKg is always locked from the database |
| **Credit Management** | Tracks outstanding balances, partial payments, and full payment history per buyer |
| **Analytics** | Weekly/monthly/yearly revenue charts; customer activity breakdown; branch performance KPIs |
| **User Management** | Three-tier role hierarchy; each role can only create users one level below itself |
| **Branch Isolation** | All data is scoped to a user's branch via JWT — no cross-branch data leakage |

---

## Tech Stack

**Frontend**
- Pure HTML5, CSS3, Vanilla JavaScript (no framework, no build step)
- Chart.js for analytics charts
- Hosted as static files (Render.com Static Site)

**Backend**
- Node.js with Express 5
- JWT authentication (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Swagger / OpenAPI documentation (`swagger-ui-express`)

**Database**
- MongoDB (Atlas cloud or local)
- Mongoose ODM

---

## Project Structure

```
KGL-project/
├── index.html                        # Landing page
├── style.css
├── loginform/
│   ├── html/login.html               # Login page
│   ├── css/login.css
│   └── JS/loginscript.js             # Login + JWT decode + redirect
├── Dashbord forms/
│   ├── CSS/                          # Shared stylesheets
│   ├── JS/                           # Page-specific scripts
│   ├── html/                         # Seller and Manager pages
│   └── DirectorsDashboard/           # Director-only pages
├── images/                           # Logo and product images
└── KGLBackend/                       # Backend (separate Node.js project)
    ├── server.js                     # Entry point
    └── src/
        ├── config/
        │   ├── db_Connect.js         # MongoDB connection
        │   └── swagger.js            # Swagger config
        ├── models/                   # Mongoose schemas
        │   ├── User.js
        │   ├── Inventory.js
        │   ├── sales.js
        │   ├── procurement.js
        │   └── Pricing.js
        ├── middlewares/
        │   ├── authMiddleware.js     # JWT verification
        │   └── rbaMiddleware.js      # Role-based access control
        ├── routes/                   # Express routers
        ├── controllers/              # Business logic
        └── services/
            └── inventoryService.js  # Shared inventory operations
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- A MongoDB instance (Atlas free tier recommended) or local MongoDB

### Environment Variables

Create a `.env` file inside the `KGLBackend/` directory:

```env
PORT=5000
JWT_SECRET=your_strong_random_secret_here
KGL_DB=mongodb+srv://<user>:<password>@cluster.mongodb.net/kgl
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

> The server will **refuse to start** if any of these three variables — `PORT`, `JWT_SECRET`, or `KGL_DB` — are missing.

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/kgl-project.git
cd kgl-project/KGLBackend

# Install backend dependencies
npm install
```

### Running the App

**Backend**

```bash
cd KGLBackend
npm start
# Server starts on http://localhost:5000
# Swagger UI available at http://localhost:5000/api-docs
```

**Frontend**

The frontend is plain HTML — serve it with any static file server:

```bash
# From the project root
npx serve .
# Or open index.html directly in a browser for local testing
```

**Seeding the first Director account**

There is no public registration endpoint by design. The first Director account must be inserted directly into MongoDB:

```js
// Run in MongoDB shell or Compass
db.users.insertOne({
  name: "Admin Director",
  email: "director@kgl.ug",
  password: "<bcrypt hash of your password>",  // use bcrypt.hashSync('password', 10)
  role: "Director"
})
```

Once a Director exists, they can create Managers via `POST /users/register`, and Managers can create Sales-agents for their own branch.

---

## User Roles

The system enforces a strict three-tier hierarchy:

```
Director
  └── can create: Managers (must assign a branch)
        └── can create: Sales-agents (auto-assigned to manager's branch)
```

| Role | Scope | Key Permissions |
|---|---|---|
| **Director** | All branches | View company-wide analytics, create Managers |
| **Manager** | Own branch only | Procurement, pricing, inventory, create Sales-agents, view branch reports |
| **Sales-agent** | Own branch only | Record cash and credit sales, collect credit payments, view personal stats |

Role and branch are embedded in the JWT at login. Every API call is scoped server-side — a Manager at Maganjo cannot read Matugga data even if they construct a manual request.

---

## API Reference

Full interactive documentation is available at `/api-docs` (Swagger UI).

**Summary of endpoints:**

```
PUBLIC
  POST   /users/login                  Authenticate; returns JWT

MANAGER ONLY
  POST   /users/register               Create a Sales-agent
  GET    /users/branch                 List users in own branch
  POST   /procurement                  Record a new stock purchase
  PUT    /procurement/:id              Update procurement record
  DELETE /procurement/:id              Delete procurement record
  PUT    /api/pricing/:productName     Set or update selling price

MANAGER + DIRECTOR
  GET    /procurement                  List procurements (branch-scoped)
  GET    /sales/branch                 Branch sales list

DIRECTOR ONLY
  POST   /users/register               Create a Manager

SALES-AGENT + MANAGER
  POST   /sales                        Record a cash or credit sale
  GET    /api/pricing                  View product price list

SALES-AGENT
  GET    /sales/dashboard              Personal performance stats
  GET    /sales/history                Own sales history

ALL AUTHENTICATED
  GET    /credits                      Active credit sales (role-scoped)
  GET    /credits/all                  All credit sales (role-scoped)
  GET    /credits/search?query=        Search credit records
  PATCH  /credits/:id/pay             Record a payment against a credit sale
  GET    /api/inventory                Branch inventory
  GET    /api/manager/statistics       Analytics charts data
  GET    /users/:id                    Read user profile
  PUT    /users/:id                    Update own bio / profile picture
```

All protected endpoints require the header:
```
Authorization: Bearer <JWT>
```

---

## Database Schema

Five collections in MongoDB:

**users** — system accounts with role and branch assignments

**procurements** — supplier purchase records; each save auto-increments the matching inventory entry

**sales** — individual sale transactions; each save atomically decrements inventory. Credit sales embed a `paymentHistory` array for a full audit trail

**inventories** — current stock levels per product per branch. Unique index on `(itemName, branch)` — one record per product per branch

**pricings** — the authoritative selling price per product per branch. Unique index on `(productName, branch)`. Prices are locked into each sale at the time of transaction

### Key relationships

```
User        ──< Procurement       (one manager records many procurements)
User        ──< Sale              (one agent records many sales)
Procurement ──> Inventory         (procurement increases stockKg)
Sale        ──> Inventory         (sale decreases stockKg, atomic)
Pricing     ──> Sale              (pricePerKg locked from Pricing at time of sale)
Sale        ──< PaymentHistory    (embedded subdocuments, not a separate collection)
```

---

## Authentication

The system uses **JWT (JSON Web Token)** authentication.

1. `POST /users/login` validates credentials and returns a signed JWT containing `{ id, role, name, branch }`
2. The token is stored in `localStorage` on the client
3. Every subsequent request sends the token in the `Authorization: Bearer` header
4. `authMiddleware` verifies the signature; an invalid or expired token returns `401`
5. `rbaMiddleware` (RBAC) checks the role embedded in the token against the route's required role

Tokens expire after **24 hours**.

> **Security note:** The current implementation stores the JWT in `localStorage`. For hardened production deployments, migrating to `httpOnly` cookies is recommended to protect against token theft via XSS.

---

## Branch Isolation

Branch isolation is a first-class design principle:

- Every data model (`Procurement`, `Sale`, `Inventory`, `Pricing`) carries a `branch` field with an enum constraint (`"Maganjo"` | `"Matugga"`)
- A user's branch is encoded in their JWT at login and attached to `req.user` by `authMiddleware`
- All controller queries read `branch` from `req.user.branch` — **never from the request body**
- A Manager from Maganjo physically cannot query Matugga records; the filter is applied server-side before any database call

---

## Known Issues & Roadmap

### Critical (should fix before production)

- [ ] **No rate limiting on `/users/login`** — brute force attacks are possible. Fix: add `express-rate-limit` (5–10 attempts per 15 minutes)
- [ ] **JWT in localStorage** — vulnerable to XSS token theft. Fix: migrate to `httpOnly` cookies
- [ ] **No password reset endpoint** — the frontend UI for password reset exists, but there is no backend implementation

### Medium priority

- [ ] **No pagination** on list endpoints (`/procurement`, `/sales/branch`, `/credits/all`) — large datasets will return oversized payloads
- [ ] **Profile pictures stored as base64 in MongoDB** — wasteful; migrate to Cloudinary or S3
- [ ] **Debug logs in production** — `authMiddleware` and several route files log JWT payloads to the console
- [ ] **Password length mismatch** — frontend requires 6 characters minimum, backend requires 8. Align to 8

### Low priority / polish

- [ ] Add compound indexes to `Sales` on `{ branch, date }` and `{ recordedBy, date }` for query performance
- [ ] Move the shared `escHtml()` function out of 8+ duplicate files into a single `utils.js`
- [ ] Remove unused signup form pages (no public registration is supported)
- [ ] Replace the manual procurement/inventory compensation pattern with MongoDB transactions (requires Atlas replica set — available on free tier)
- [ ] Add a test suite (Jest + Supertest)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: describe what you added"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please keep the branch isolation principle intact — any new data model or endpoint must read `branch` from `req.user`, never from the client request body.

---

## License

This project is proprietary software owned by Karibu Groceries Limited. All rights reserved.