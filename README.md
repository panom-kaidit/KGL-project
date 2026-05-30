# Karibu Groceries Limited — Management System

Running a two-branch grain trading business on paper is a mess. Stock levels live in notebooks, credit customers forget they owe money, and nobody really knows which branch is performing better until month-end when it's too late to do anything about it. That's the problem this project set out to solve.

**KGL** (Karibu Groceries Limited) is a full-stack internal management platform built for a real agricultural produce trading company in Uganda. The company buys cereals and grains — maize, beans, groundnuts, soya, and cow peas — from farmers, stores them across two branches, and resells them to buyers. This system tracks the entire chain: from the moment a supplier delivers stock to the moment the last payment clears on a credit sale.

It's not a public-facing e-commerce store. It's an internal operations tool used daily by three types of staff: a Director who oversees the whole business, Managers who run individual branches, and Sales-agents who handle counter sales.

---

## Author

**Panom Michael Makuei**
Full-Stack Developer

- GitHub: [@panom-kaidit](https://github.com/panom-kaidit)
- Frontend: [karibu-gl.netlify.app](https://karibu-gl.netlify.app/)
- Backend API: [kgl-project-3g6j.onrender.com](https://kgl-project-3g6j.onrender.com)
- API Docs: [kgl-project-3g6j.onrender.com/api-docs](https://kgl-project-3g6j.onrender.com/api-docs)

> Built as a real-world management system for an agricultural trading company in Uganda.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [Project Structure](#project-structure)
- [Repositories & Deployment](#repositories--deployment)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Application Workflows](#application-workflows)
- [User Roles & Permissions](#user-roles--permissions)
- [Screenshots](#screenshots)
- [Challenges & Design Decisions](#challenges--design-decisions)
- [Known Issues & Future Improvements](#known-issues--future-improvements)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)


---

## Project Overview

Karibu Groceries Limited operates two branches — **Maganjo** and **Matugga** — and before this system existed, tracking stock, chasing credit customers, and understanding branch performance required piecing together paper records and spreadsheets that were always a few days behind reality.

The system digitizes every step of the business:

- **Procurement**: when a supplier delivers 2,000 kg of maize, a Manager records it and the stock level updates instantly
- **Inventory**: each branch has a live stock count, with automatic colour-coded alerts for low and out-of-stock items
- **Pricing**: Managers set selling prices per product; the system enforces that you can never sell below buying price
- **Sales**: Sales-agents record both cash and credit transactions; the selling price is always locked server-side — nobody can manipulate it from the form
- **Credit management**: credit customers are tracked by name, National ID, and phone number; every partial payment is logged with a timestamp and the agent who recorded it
- **Analytics**: revenue by week, customer activity breakdowns, and yearly overviews — all scoped to the branch the Manager actually runs

The intended audience is the company's own staff. Three role levels exist in a clear hierarchy: Director at the top, Managers in the middle, and Sales-agents at the counter. Each role sees only the screens and data relevant to their job.

---

## Features

### Authentication & Role Management
Every user account belongs to one of three roles. Login issues a JWT that encodes the user's role and branch — there's no second database call to figure out who someone is. The session lasts 24 hours and the system redirects to login automatically on expiry. User creation follows a strict hierarchy: a Director creates Managers, Managers create Sales-agents for their own branch only.

### Branch Isolation
This was a core design requirement from the start. A Manager at Maganjo cannot see, create, or modify anything at Matugga. The branch isn't read from a form field or URL parameter — it's extracted from the signed JWT on every single request. Spoofing it from the client is not possible.

### Procurement Recording
Managers log every incoming delivery: supplier name, contact, product, quantity in kilograms, cost per kilogram, payment method, and invoice number. The moment a procurement saves, the inventory count for that product at that branch increases automatically. If the inventory update fails for any reason, the procurement record is rolled back — the two are always kept in sync.

### Live Inventory Tracking
The inventory view merges stock levels with current pricing in one screen. Each product shows its current stock in kilograms, its buying cost, its selling price, and a status badge: in-stock (green), low-stock (yellow, under 200 kg), or out-of-stock (red). Managers can see at a glance what needs restocking.

### Pricing Control
Managers set selling prices per product per branch. The system enforces a hard business rule server-side: a selling price cannot be set below the buying price. When a price is updated, the inventory record is kept in sync automatically. Sales-agents never see the buying cost — they only see the selling price, which they cannot override.

### Cash & Credit Sales
Sales-agents work from a catalog view that shows every available product with its current price and stock level. Disabled products are clearly marked with a tooltip explaining why — either "No pricing set" or "Out of stock." The agent selects a product, enters a quantity, and submits. The backend recalculates the total using the database price, checks stock atomically, deducts inventory, and saves the sale.

Credit sales require additional buyer details: full name, National ID, phone number, location, and a payment due date. The outstanding balance is tracked until fully cleared.

### Credit Payment Collection
When a credit customer returns to pay, the Sales-agent searches by any identifying detail — name, National ID, phone, location, or product name. The matching record loads with a visual progress bar showing how much has been paid and how much remains. Each payment is logged with the amount, date, and recording agent. The status moves automatically: pending → partial → paid.

### Analytics Dashboards
- **Sales-agents** see their personal stats: today's sales count and revenue, this week's totals, and their single best-performing day ever
- **Managers** see monthly sales broken down by week, a customer activity breakdown (new vs returning vs inactive), and a full-year revenue overview by month — all scoped to their branch
- **Directors** see company-wide KPIs: total revenue, total transactions, total units sold, active branches, and a six-month revenue trend line. They also get a per-branch performance comparison

### User Management
Directors manage Managers; Managers manage their own Sales-agents. The user management screens show all users in scope with options to edit profiles and, where permitted, remove accounts.

---

## Tech Stack

### Frontend
- **HTML5, CSS3, Vanilla JavaScript** — no framework, no build step. The frontend is a traditional multi-page application where each page is a separate HTML file with its own JavaScript file. This was a deliberate choice: the project doesn't need reactive re-rendering or complex client-side state, and keeping it framework-free means anyone who knows basic web development can read and modify it without learning React or Vue first.
- **Chart.js** — used for the analytics dashboards. Renders bar, line, and pie charts from aggregated data returned by the backend.
- **Fetch API** — all HTTP communication uses the browser's native `fetch()`. No Axios, no HTTP library.

### Backend
- **Node.js** with **Express 5** — the web server and API layer. Express handles routing, middleware chaining, and error handling. CommonJS modules throughout.
- **jsonwebtoken** — creates and verifies JWTs for authentication
- **bcryptjs** — hashes passwords at rest with 10 salt rounds. Plaintext passwords are never stored anywhere
- **Mongoose 9** — the ODM layer between Node.js and MongoDB. Handles schema validation, type casting, and query building
- **swagger-ui-express** + **swagger-jsdoc** — auto-generates interactive API documentation from JSDoc comments in the route files, accessible at `/api-docs`
- **dotenv** — loads environment variables from a `.env` file at startup

### Database
- **MongoDB** (Atlas cloud in production, local in development) — a document database that suits the flexible, nested nature of the data here. Credit sales with embedded payment history arrays are a natural fit for MongoDB's document model. Mongoose enforces schema shape and validators at the application level.

### Tools & Hosting
- **Render.com** — backend hosting (free tier, spins down after inactivity)
- **Netlify** — frontend hosting (primary deployment)
- **GitHub Pages** — frontend mirror deployment
- **Git / GitHub** — version control, with separate repositories for frontend and backend

---

## System Architecture

### Project Architecture

> Insert project architecture diagram here

&nbsp;

&nbsp;

&nbsp;

The application is split into two completely separate projects hosted independently. The frontend is a collection of static HTML, CSS, and JavaScript files — it has no server-side rendering and requires no build process. It is deployed as a static site and makes HTTP requests to the backend API.

The backend is a Node.js Express application deployed on Render. It exposes a REST API over HTTPS and connects to a MongoDB Atlas cluster. It handles all authentication, business logic, data validation, and database operations.

The flow for a typical request looks like this:

```
Browser (static HTML/JS on Netlify or GitHub Pages)
    │
    │  HTTPS request with Authorization: Bearer <JWT>
    ▼
Express Backend (Render.com — kgl-project-3g6j.onrender.com)
    │
    ├── CORS check (origin whitelist)
    ├── Security headers applied
    ├── JSON body parsed
    ├── authMiddleware — verifies JWT signature
    ├── authorizeRole  — checks role against route requirements
    │
    ├── Route handler selected
    │       │
    │       ├── Controller — validates input, orchestrates logic
    │       ├── Service    — shared operations (e.g., stock changes)
    │       └── Mongoose Model — queries MongoDB
    │
    ▼
MongoDB Atlas
    │
    └── Response JSON returned to browser
```

The frontend stores the JWT in `localStorage` and attaches it to every request as a `Bearer` token. The backend never reads a user's branch or role from the request body — those values come exclusively from the decoded token, which the server signed itself.

---

## Database Design

### Entity Relationship Diagram (ERD)

> Insert ERD diagram here

&nbsp;

&nbsp;

&nbsp;

The database has five collections, each with a clear responsibility:

**users** stores staff accounts. The `role` and `branch` fields are the most important — they control everything a user can see and do across the entire application. The Director's branch is set to `"Main"` because they are not tied to one location.

**procurements** records every supplier delivery. Each document points back to the Manager who recorded it via a `recordedBy` ObjectId reference. Saving a procurement automatically triggers a stock increase in the `inventories` collection.

**sales** is the most important collection. It records every transaction — cash or credit. Credit sales carry an embedded `paymentHistory` array that grows over time as the customer makes payments. The `pricePerKg` on each sale is locked at the time of the transaction from the `pricings` collection, so historical records always reflect what the price actually was at the time of sale.

**inventories** is the real-time stock ledger. One document exists per product per branch — enforced by a compound unique index on `{ itemName, branch }`. Stock levels change automatically when procurements arrive and when sales are made. The minimum value is always zero; the service layer prevents overselling.

**pricings** stores the current selling price per product per branch, also enforced as unique per `{ productName, branch }`. It is separate from inventory deliberately — pricing policy and physical stock are different concerns. When a price changes, the corresponding inventory document is updated in sync.

**Relationships in plain language:**
- One Manager → many Procurements
- One Sales-agent → many Sales
- One Sale → many PaymentHistory entries (embedded in the Sale document, not a separate collection)
- Each Procurement → triggers an update to one Inventory document
- Each Sale → triggers a deduction from one Inventory document
- Each Sale → reads its `pricePerKg` from one Pricing document at creation time

---

## Project Structure

The project lives in two separate repositories. Here is what each folder contains and why it is organised that way.

### Frontend — `KGL_Frontend`

```
KGL_Frontend/
├── index.html                        # Public landing page
├── style.css                         # Landing page styles and animations
│
├── loginform/
│   ├── html/login.html               # Login page
│   ├── JS/loginscript.js             # Login logic, JWT decode, role-based redirect
│   └── css/login.css
│
├── dashboard-forms/
│   ├── JS/
│   │   ├── apiConfig.js              # Sets window.API_URL — all other files read from here
│   │   ├── logout.js                 # Clears localStorage and redirects on logout
│   │   ├── Salesform.js              # Cash + credit sale form with cart system
│   │   ├── creditsform.js            # Credit search + payment recording
│   │   ├── goSell.js                 # Product catalog + sales history view
│   │   ├── procurement.js            # Procurement entry form
│   │   ├── managersDashboard.js      # Inventory summary + branch performance
│   │   ├── statistics.js             # Manager analytics charts
│   │   ├── addUser.js                # Create/edit user form (dual-mode)
│   │   ├── usermanagement.js         # Manager user list
│   │   └── salesDashboard.js         # Sales-agent personal stats
│   │
│   ├── HTML/                         # All dashboard HTML pages
│   ├── CSS/                          # Shared dashboard stylesheets
│   │
│   └── DirectorsDashboard/
│       ├── directorsDashboard.html
│       ├── directorsDashboard.js     # Company-wide KPIs + charts
│       ├── directorUserManagement.js
│       └── usermanegementDash.html
│
├── Password/                         # Password reset UI (backend not yet implemented)
├── signup-forms/                     # Placeholder signup UI (not connected to backend)
└── images/                           # Logo and product images
```

Each JavaScript file is responsible for exactly one page. There is no shared state between pages — everything reloads from the API when a page opens. `apiConfig.js` is the one file that every HTML page loads first, so changing the backend URL is a one-line edit in one file.

### Backend — `KGL_Backend`

```
KGLBackend/
├── server.js                         # Entry point — wires everything together
├── .env                              # Environment variables (never committed)
│
└── src/
    ├── config/
    │   ├── db_Connect.js             # Opens the MongoDB connection at startup
    │   └── swagger.js                # OpenAPI spec configuration
    │
    ├── models/
    │   ├── User.js                   # Staff accounts
    │   ├── sales.js                  # Sale transactions (cash + credit)
    │   ├── procurement.js            # Supplier deliveries
    │   ├── Inventory.js              # Real-time stock per branch
    │   └── Pricing.js                # Selling prices per product per branch
    │
    ├── middlewares/
    │   ├── authMiddleware.js         # JWT verification → populates req.user
    │   └── rbaMiddleware.js          # Role-based access control
    │
    ├── routes/
    │   ├── userRoutes.js
    │   ├── salesRoutes.js
    │   ├── creditRoutes.js
    │   ├── procurementRoutes.js
    │   ├── inventoryRoutes.js
    │   ├── pricingRoutes.js
    │   └── statisticsRoutes.js
    │
    ├── controllers/                  # Business logic — one file per domain
    │
    ├── services/
    │   └── inventoryService.js       # Shared stock increase / decrease / price-sync
    │
    └── utils/
        └── seedDirector.js           # Seeds the initial Director account on startup
```

Routes declare what URLs exist and which middleware runs. Controllers contain the business logic. Services hold operations that multiple controllers share — inventory changes happen during both procurement and sales, so the logic lives in one place. Models define the database contract.

---

## Repositories & Deployment

The project was originally a single repository but was split after GitHub Pages deployment issues — GitHub Pages only serves static files and cannot run a Node.js backend. Separating the two also means they can be updated, versioned, and deployed completely independently.

| Component | Repository | Live URL |
|---|---|---|
| Frontend | [KGL_Frontend](https://github.com/panom-kaidit/KGL_Frontend.git) | [karibu-gl.netlify.app](https://karibu-gl.netlify.app/) |
| Frontend (mirror) | Same repo | [panom-kaidit.github.io/KGL_Frontend](https://panom-kaidit.github.io/KGL_Frontend/index.html) |
| Backend | [KGL_Backend](https://github.com/panom-kaidit/KGL_Backend.git) | [kgl-project-3g6j.onrender.com](https://kgl-project-3g6j.onrender.com) |
| API Docs | Backend | [/api-docs](https://kgl-project-3g6j.onrender.com/api-docs) |

> **Note on Render free tier:** The backend is on Render's free plan, which spins the server down after 15 minutes of inactivity. The first request after a quiet period can take 30–60 seconds while the server wakes up. This is normal behaviour — subsequent requests respond quickly.

---

## Installation & Setup

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- A MongoDB instance — [MongoDB Atlas free tier](https://www.mongodb.com/cloud/atlas) is the easiest starting point
- Git

### 1. Clone the repositories

```bash
# Backend
git clone https://github.com/panom-kaidit/KGL_Backend.git
cd KGL_Backend

# Frontend (in a separate terminal or folder)
git clone https://github.com/panom-kaidit/KGL_Frontend.git
```

### 2. Install backend dependencies

```bash
cd KGL_Backend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `KGL_Backend` root directory. See the [Environment Variables](#environment-variables) section below for what each one does.

```env
PORT=5000
JWT_SECRET=your_strong_random_secret_here
KGL_DB=mongodb+srv://<username>:<password>@cluster.mongodb.net/kgl
ALLOWED_ORIGINS=http://localhost:3000
DIRECTOR_PASSWORD=your_secure_director_password
```

The server performs an environment check before anything else runs. If `PORT`, `JWT_SECRET`, or `KGL_DB` are missing, it crashes immediately with a clear error message rather than starting in a broken state.

### 4. Start the backend

```bash
npm start
```

You should see:
```
Connected to MongoDB
Server running on port 5000
```

On first run, the application automatically creates a Director account in the database if one doesn't already exist. Check `src/utils/seedDirector.js` for the default email (`director@kgl.com`) and update it to match your environment before going live.

### 5. Serve the frontend

The frontend requires no build step. Serve it with any static file server:

```bash
cd KGL_Frontend
npx serve .
# Visit http://localhost:3000
```

Alternatively, open `index.html` directly in a browser for quick local testing.

### 6. Log in and bootstrap your users

Log in with the Director credentials from step 4. From there:

1. Director creates a Manager and assigns them to a branch (Maganjo or Matugga)
2. Manager logs in and creates Sales-agents for their branch

That's the full setup. There is no public self-registration by design.

---

## Environment Variables

All configuration lives in a `.env` file in the backend root. This file should never be committed to version control. Add it to your `.gitignore`.

| Variable | Required | Description |
|---|:---:|---|
| `PORT` | Yes | Port the Express server listens on (e.g. `5000`) |
| `JWT_SECRET` | Yes | Secret key used to sign and verify JWTs. Use a long random string — at least 32 characters. Changing this invalidates all existing sessions |
| `KGL_DB` | Yes | Full MongoDB connection string including the database name (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/kgl`) |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of frontend origins allowed by CORS. Must include your Netlify URL and any local development URLs |
| `DIRECTOR_PASSWORD` | Recommended | Initial password for the seeded Director account. If not set, a hardcoded fallback in `seedDirector.js` is used — always override this before any real deployment |

Keep an `.env.example` file in the repository with placeholder values so new developers know exactly what to fill in:

```env
PORT=5000
JWT_SECRET=replace_with_a_random_32_char_string
KGL_DB=mongodb+srv://username:password@cluster.mongodb.net/kgl
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.netlify.app
DIRECTOR_PASSWORD=replace_with_strong_password
```

---

## API Overview

The full interactive documentation — with live request testing — is at `/api-docs` on the running backend. Below is a plain-language summary of what each group of endpoints does.

### Authentication — `POST /users/login`
The only public endpoint. Accepts email and password, returns a signed JWT on success. The same error message is returned for both "email not found" and "wrong password" — this is intentional, to prevent an attacker from enumerating valid email addresses.

### User Management — `/users`
Registration is restricted by role: Directors create Managers, Managers create Sales-agents. A Manager creating a Sales-agent cannot assign them to a different branch — that's enforced server-side. Managers can view, edit, and delete users within their own branch.

### Sales — `POST /sales`, `GET /sales/*`
Any authenticated Sales-agent or Manager can record a sale. The backend always fetches the price from the Pricing collection — whatever price the client sends in the request body is ignored. A sale is rejected if there is not enough stock. Several GET endpoints provide filtered views: personal history for agents, branch-level views for Managers, and company-wide views for Directors.

### Credits — `/credits`
All authenticated users can view credit records, filtered to their scope. The key endpoint is `PATCH /credits/:id/pay` — it validates the payment amount, deducts from the outstanding balance, and appends a timestamped entry to the payment history array.

### Procurement — `/procurement`
Managers record incoming deliveries. Every successful save automatically updates the relevant inventory record. Directors can view procurement records across all branches.

### Inventory — `GET /api/inventory`
Returns current stock levels for the caller's branch, merged with current pricing data. Used by the Manager dashboard and the Sales-agent product catalog.

### Pricing — `/api/pricing`
Managers view and update selling prices. Selling price below the current buying cost is rejected. Price changes are propagated to the inventory record automatically.

### Statistics — `GET /api/manager/statistics`
Returns three analytics datasets in a single database round-trip using MongoDB's `$facet` aggregation: weekly breakdown for the current month, customer activity classification, and monthly totals for the full year.

---

## Application Workflows

### Manager records a stock delivery

1. Manager fills in the Procurement form: supplier, product, quantity, price, invoice number
2. Client-side validation runs first — catches obvious mistakes before touching the network
3. `POST /procurement` fires with the JWT in the header
4. Backend reads the branch from the JWT — the form field is ignored
5. Server validates inputs again independently
6. Procurement document saves to MongoDB
7. `inventoryService.increaseStock()` runs: if a record exists for that product and branch, `stockKg` increments; if not, a new inventory record is created automatically
8. If the inventory update fails, the procurement record is deleted to keep things consistent
9. The Manager dashboard inventory cards reflect the new stock on next load

### Sales-agent records a cash sale

1. Agent opens the Go Sell page — pricing and inventory load in parallel using `Promise.all()`
2. Products with zero stock or no pricing are shown disabled with a clear tooltip
3. Agent selects a product, enters quantity, and adds it to the cart
4. After filling buyer name and date, the agent submits
5. For each item in the cart, `POST /sales` fires sequentially
6. Backend fetches the price from the Pricing collection — the client's value is ignored
7. Stock deduction is atomic: if stock is sufficient it decrements and the sale saves; if not, the request returns a clear error with the quantity that is actually available

### Customer returns to settle a credit balance

1. Agent opens the Credits form and searches by any identifying detail
2. `GET /credits/search?query=...` returns matching records
3. The first match loads: buyer info, original amount, total paid, remaining balance, a progress bar, and the full payment history
4. Agent enters the payment amount and submits
5. `PATCH /credits/:id/pay` validates the amount (positive, not exceeding what's owed), deducts from `amountDue`, appends to `paymentHistory`, and updates the status
6. The UI updates in place — the progress bar animates to the new percentage, the balance updates, and a new row appears in the payment history

### Director reviews company performance

1. The Director dashboard fires three requests simultaneously using `Promise.allSettled()`
2. `allSettled` is used deliberately — if one endpoint fails, the dashboard still renders what it can rather than breaking entirely
3. Sales and credit arrays are merged and de-duplicated using a `Map` keyed on `_id`
4. KPI cards show total revenue, transaction count, units sold, active branches, and outstanding credit
5. A Chart.js line chart renders the last six months of revenue trend

---

## User Roles & Permissions

```
Director
  └── Creates: Managers (must assign to a branch)
        └── Creates: Sales-agents (auto-assigned to Manager's branch)
```

| Permission | Director | Manager | Sales-agent |
|---|:---:|:---:|:---:|
| Create Managers | ✓ | — | — |
| Create Sales-agents | — | ✓ own branch | — |
| View all-branch data | ✓ | — | — |
| Manage procurement | — | ✓ | — |
| Set product prices | — | ✓ | — |
| Record sales | — | ✓ | ✓ |
| Record credit payments | — | ✓ | ✓ |
| View branch analytics | ✓ | ✓ own branch | — |
| View personal sales stats | — | — | ✓ |

Role and branch are embedded in the JWT at login time. Every API request reads `req.user.role` and `req.user.branch` from the decoded token — these values cannot be overridden from the client.

---

## Challenges & Design Decisions

### Splitting into two repositories

The original plan was a single monorepo. After attempting to deploy the full project on GitHub Pages, the limitation was immediately apparent — GitHub Pages only serves static files and has no way to run a Node.js process. Rather than hacking around this, the cleaner decision was to separate them: the static frontend goes to Netlify (with GitHub Pages as a mirror), and the backend API goes to Render. This also has real engineering benefits beyond the deployment fix — the two projects can be updated, versioned, and deployed independently.

### Choosing vanilla JavaScript over a framework

This was a deliberate engineering choice. React or Vue would have been reasonable options, but they introduce a build pipeline, bundler configuration, component conventions, and framework-specific mental models that any contributor needs to learn before touching the code. Because each dashboard page is mostly read-once data display rather than continuously reactive state, the complexity of a component framework isn't justified by what it would actually solve. Anyone who knows basic web development can open a JS file and understand what it does in under five minutes.

### Server-side price enforcement

One of the first questions in the sales flow design was whether to trust the price sent from the client. The answer was a clear no. A Sales-agent could open developer tools, modify the request, and submit a sale at any price they wanted. By fetching the price from the Pricing collection on the server at the moment of sale and ignoring the client's value entirely, this isn't a concern. Every sale record always reflects the real price.

### Branch isolation via JWT

An earlier version of the login code made a second API call to `GET /users/:id` after login just to get the user's branch — even though the branch was already sitting inside the JWT payload. That was a wasted round trip. The branch is now read directly from the decoded token. More importantly, branch filtering on every query reads from `req.user.branch` (the token) rather than from any client-supplied value. A Manager at Maganjo genuinely cannot retrieve Matugga data regardless of what they send in the request.

### Embedding payment history instead of a separate collection

Credit sales store their full payment history as an array inside the sale document rather than in a separate `payments` collection. This is a MongoDB document design decision. Payment history is only ever accessed alongside its parent sale — there is no use case for querying payments independently of the sale they belong to. Embedding means a single document read returns the complete picture, and the audit trail is always co-located with the transaction it describes.

### Using `Promise.allSettled` in the Director dashboard

The Director dashboard fetches from three endpoints simultaneously. `Promise.all` would cause the entire dashboard to fail if any single endpoint returned an error. `Promise.allSettled` waits for all requests to complete regardless of individual outcomes and returns results for each. If the procurement endpoint is temporarily slow, the dashboard still loads the sales and credits data. Showing partial data is almost always more useful than showing nothing.

---

## Known Issues & Future Improvements

### Issues to address before serious production use

**No rate limiting on login** — `POST /users/login` has no brute-force protection. An automated attacker can make unlimited login attempts per second. Adding `express-rate-limit` with a cap of 10 attempts per 15 minutes per IP is a quick fix.

**JWT stored in localStorage** — `localStorage` is readable by any JavaScript on the page. If an XSS vulnerability ever appeared, tokens could be read and reused. The more secure approach is `httpOnly` cookies, which are inaccessible to JavaScript entirely. The current XSS mitigations make this low-risk in practice, but it is worth addressing for a production system.

**Hardcoded default Director password** — `seedDirector.js` has a fallback hardcoded password visible in source code. Always set the `DIRECTOR_PASSWORD` environment variable before deploying anywhere real.

**No password reset flow** — the frontend has a fully designed password reset UI, but no backend endpoint supports it. Users who forget their password need an admin to reset it directly in the database.

**`preselectFromQuery()` defined twice in Salesform.js** — the function is defined on two different lines. The second definition overwrites the first, which means navigating to the sales form with `?product=Maize` doesn't pre-select the cash tab dropdown. Only the credit tab benefits. This is a one-line rename fix.

**No pagination on list endpoints** — `GET /procurement`, `GET /credits/all`, and `GET /sales/branch` return every record. For a new business this is fine; after years of operation it will cause slow page loads and large memory usage.

### Planned improvements

- Replace the manual procurement rollback with MongoDB transactions for true atomicity
- Fix the stock deduction race condition with a truly atomic `findOneAndUpdate` that embeds the stock check in the query condition itself
- Add compound database indexes on `{ branch, date }` on the Sales collection for faster analytics queries
- Move shared utility functions (`decodeToken`, `escapeHtml`, `readJsonSafely`, `showMessage`) out of every individual file and into a single `utils.js` loaded once per page
- Create a shared `api.js` module to replace the repeated `fetch()` boilerplate scattered across 15+ files
- Add a test suite using Jest and Supertest — currently there are no automated tests
- Add loading skeletons and empty-state messages to tables throughout the frontend
- Connect the password reset UI to a real backend implementation
- Remove or properly connect the non-functional signup forms

---

## Troubleshooting

**Server won't start — "Missing required environment variables"**
The server checks for `PORT`, `JWT_SECRET`, and `KGL_DB` before anything else. Open your `.env` file and confirm all three are present with real values, not placeholders.

**MongoDB connection fails at startup**
Check that your `KGL_DB` connection string is correct, including the database name at the end. If using Atlas, confirm your current IP address is in the IP Access List under Network Access in the Atlas dashboard. Atlas free clusters reject connections from unlisted IPs.

**Login succeeds but immediately redirects back to login**
This usually means `localStorage` is blocked — some browsers disable it in private/incognito mode. Try a regular browser window. It can also mean the JWT payload failed to parse — check the browser console for a JSON error.

**API calls return CORS errors in the browser**
The backend reads allowed origins from `ALLOWED_ORIGINS`. If your frontend's URL is not in that list, every cross-origin request will be blocked. Add the URL to the environment variable and restart the backend.

**The backend on Render is very slow on the first request**
Render's free tier spins down inactive servers. The first request after inactivity takes 30–60 seconds while the server restarts. This is normal. Requests respond quickly once the server is awake.

**Charts on the statistics page show no data**
The stats endpoint aggregates by the current month and year. If no sales have been recorded, all values are zero. Record a few test sales, then reload the page.

**"Insufficient stock" error when recording a sale**
The product's inventory is at zero or below the requested quantity. A Manager needs to record a procurement for that product at that branch before sales can proceed.

**Inventory doesn't update after a procurement**
If the inventory update failed during procurement creation, the procurement record is automatically deleted to prevent inconsistency. Check the server logs for the specific error. Usually this is a database connectivity issue.

---

## Contributing

Contributions are welcome from teammates, collaborators, and anyone who finds something worth improving.

1. Fork the relevant repository (frontend or backend — they are separate)
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and test them thoroughly
4. Commit with a clear message: `git commit -m "feat: describe what you added"`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Open a Pull Request with a description of what you changed and why

**A few things to keep in mind:**

- The branch isolation principle is not negotiable. Any endpoint that reads or writes data must get `branch` from `req.user.branch`, never from the request body or URL parameters
- Selling price must always be determined server-side. Do not add any code path that allows a client-supplied price to be saved to a sale record
- If you add a new endpoint, add a Swagger JSDoc comment so the API documentation stays current
- On the frontend, make sure `escapeHtml()` is applied to anything injected into `innerHTML`
- If a utility function already exists somewhere in the codebase (like `decodeToken` or `escapeHtml`), use it rather than writing another copy

---

## License

This project is proprietary software. All rights reserved.


---