# 🍽️ Canteen Queue Management System

A full-stack, automated cafeteria ordering and queue management platform built for modern university campuses and corporate offices. The system replaces chaotic physical counter queues with seamless digital ordering, real-time queue number progression, multi-gateway online payments, bulk event catering, and an intuitive kitchen dispatch dashboard.

---

## 📌 Problem Statement & Purpose

### The Problem
During peak hours (e.g., campus lunch breaks or office shift transitions), traditional cafeteria operations suffer from:
- **Crowded Counters & Long Lines**: Customers wait idly in physical queues just to place an order and wait again for food preparation.
- **Order Miscommunication & Lost Tokens**: Handwritten or verbal token numbering leads to out-of-order preparation, lost receipts, and customer frustration.
- **Inaccurate Wait Times**: Customers cannot gauge whether food will take 5 minutes or 25 minutes, causing counter crowding.
- **Manual Kitchen Chaos**: Kitchen staff struggle to prioritize orders, monitor item availability, or coordinate bulk event requirements with daily walk-in orders.

### The Solution
This platform automates the end-to-end canteen ordering workflow:
1. **Contactless Digital Ordering**: Users browse a live, categorized menu from their phones or laptops, add items to a smart cart, and place orders with flexible payment options.
2. **Transparent Queue Progression**: Every order receives a unique, sequential queue token. Customers track their order status in real time (`Pending` ➔ `Preparing` ➔ `Ready for Pickup` ➔ `Completed`) along with estimated preparation countdowns.
3. **Public Queue Display Board**: A public status board shows "Now Serving", orders currently in preparation, queue depth, and average wait time.
4. **Kitchen & Administrative Control**: Canteen staff manage menu items (CRUD), advance order statuses with a single click, track payment verifications, and organize bulk event catering.

---

## ✨ Features Implemented

### 🧑‍🎓 1. Customer & Student Experience
- **User Authentication & Profile Setup**:
  - Secure registration and login using JWT stored in HTTP-only cookies and bcrypt password hashing.
  - Profile customization including display name, bio, and avatar upload.
- **Digital Interactive Menu**:
  - Categorized menu items (**Main Course**, **Beverages**, **Snacks**) with high-resolution photos, prices, descriptions, and preparation times.
  - Filter by category or search for specific dishes.
- **Smart Cart & Wait Time Calculation**:
  - Add, adjust quantities, or remove items in real time.
  - Dynamic bill calculation (item totals, taxes) with estimated preparation time calculated from cart contents.
- **Flexible Multi-Gateway Payments**:
  - **Razorpay**: Direct support for UPI, QR codes, Credit/Debit cards, and Netbanking.
  - **Stripe**: Credit/Debit card processing and international payments.
  - **Cash on Delivery / Counter Pay**: Option to pay in cash upon pickup at the canteen counter.
- **Live Order Tracking**:
  - Real-time token number (e.g., `#042`) and order status progression.
  - Dynamic estimated wait time countdown.
  - Toast alert notification when food is ready for collection.
- **Public Queue Display Board**:
  - Accessible screen view showing active queue stats, orders currently preparing, and orders ready for pickup.
- **Bulk & Event Pre-ordering**:
  - Dedicated workflow for university club meetings, conferences, or student fests.
  - Select event date and time, venue location, estimated attendee count, contact details, itemized food quantities, and special dietary instructions.
  - Track event order status from confirmation to preparation and delivery.

---

### 👨‍🍳 2. Kitchen & Admin Operations
- **Role-Based Admin Portal**:
  - Secure login with admin privileges to access operational tools.
- **Live Order Fulfillment Kanban**:
  - Visual dashboard of incoming orders split into actionable stages.
  - Single-click status transitions:
    - `Pending` ➔ **Start Preparing**
    - `Preparing` ➔ **Mark Ready**
    - `Ready` ➔ **Complete Order**
  - Instant visibility into customer details, items ordered, order value, payment method, and payment verification status (`unpaid`, `paid`, `refunded`).
- **Complete Menu Management (CRUD)**:
  - Add new dishes with pricing, preparation times, categories, and descriptions.
  - Upload dish photos directly using AWS S3 object storage presigned URLs or local uploads.
  - Update prices and descriptions or delete discontinued items.
- **Event & Catering Management**:
  - Review bulk pre-order requests with attendee counts and dietary instructions.
  - Confirm, prepare, schedule, or cancel bulk catering bookings.
- **Queue & Operations Metrics**:
  - Real-time overview of current active queue load, orders completed, and average kitchen turnaround times.

---

### 🛡️ 3. Backend & System Engineering
- **Sequential Queue Generation**: Atomic counter generation in PostgreSQL to ensure duplicate-free, sequential queue tokens under concurrent order submissions.
- **PostgreSQL Migrations & Schema**: Structured SQL migrations handling relational data for users, menu items, orders, event catering, and counter sequences.
- **RESTful API**: Clean route architecture separating authentication, menu, orders, payments, admin operations, and profiles.
- **Observability & Health Checks**:
  - Built-in Prometheus telemetry endpoint (`/metrics`) tracking HTTP request latencies and error rates.
  - Kubernetes-ready liveness (`/api/live`) and readiness (`/api/ready`, `/api/health`) probes verifying database availability.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Radix UI primitives, Sonner toasts |
| **Backend** | Node.js, Express.js, TypeScript, PostgreSQL Client (`pg`), Multer, Cookie-Parser, CORS |
| **Database** | PostgreSQL 16 (with relational indexing and atomic sequence counter) |
| **Payment Gateways** | Razorpay SDK, Stripe SDK |
| **Cloud & Media** | AWS SDK (S3 Presigned URLs for menu images) |
| **DevOps & Containers**| Docker, Docker Compose, Nginx (frontend reverse proxy) |
| **Orchestration** | Kubernetes manifests (Deployments, Services, Ingress, Horizontal Pod Autoscaling) |
| **CI/CD** | GitHub Actions (automated testing, multi-stage Docker builds, GHCR publishing, SSH deployment) |
| **Monitoring / SRE** | Prometheus (metrics), Grafana (dashboards & visualization), Loki (log aggregation), Tempo (traces), Grafana Alloy (telemetry collector) |


---

## 🔄 Order Lifecycle & Workflow

```mermaid
flowchart TD
    A[Student Browses Menu] --> B[Add Items to Cart]
    B --> C{Checkout & Payment}
    C -->|Razorpay / Stripe| D[Online Payment Verified]
    C -->|Cash / Counter| E[Payment Marked 'Unpaid' - Pay at Counter]
    D --> F[Atomic Queue Token Generated #NNN]
    E --> F
    F --> G[Order Status: PENDING]
    G --> H[Kitchen Starts Preparation: PREPARING]
    H --> I[Kitchen Marks Order as READY]
    I --> J[Student Receives Ready Alert]
    J --> K[Student Collects Food & Counter Closes: COMPLETED]
```

---

## 🗄️ Database Schema Overview

The database is built on PostgreSQL with foreign key constraints and indexed status fields:

- **`users`**: User identities, credentials (`password_hash`), profiles (`display_name`, `bio`, `profile_picture`), and roles (`user` or `admin`).
- **`menu_items`**: Dish catalog (`name`, `category`: `main`/`beverage`/`snack`, `price`, `image`, `prep_time`, `description`).
- **`orders`**: Daily customer orders (`user_id`, `queue_number`, `items[]`, `status`: `pending`/`preparing`/`ready`/`completed`, `total_price`, `estimated_time`, `payment_status`: `unpaid`/`paid`/`refunded`, `payment_method`).
- **`event_orders`**: Bulk catering requests (`event_name`, `event_date`, `location`, `attendees_count`, `contact_name`, `contact_phone`, `items` JSON, `special_instructions`, `total_price`, `status`).
- **`counters`**: Key-value sequence storage ensuring atomic, gap-free queue number increments.
- **`schema_migrations`**: Migration ledger tracking applied SQL scripts.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) (recommended for containerized execution)
- [PostgreSQL](https://www.postgresql.org/) (if running locally without Docker)

---

### Option 1: Run with Docker Compose (Recommended)

#### Standard Application Stack
Spin up the core services (PostgreSQL database, Redis, Backend API, and Frontend with Nginx):

```bash
docker compose up --build -d
```

- **Frontend Application**: [http://localhost](http://localhost) (or [http://localhost:5173](http://localhost:5173))
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Database**: `localhost:5432`

#### Full Stack with Observability (Grafana, Prometheus, Loki, Tempo, Alloy)
To launch the application alongside the full SRE and monitoring suite:

```bash
docker compose --profile observability up --build -d
```

- **Grafana Dashboard**: [http://localhost:3000](http://localhost:3000) (Login: `admin` / `${GRAFANA_ADMIN_PASSWORD}`)
- **Prometheus Metrics**: [http://localhost:9090](http://localhost:9090)
- **Backend API Metrics Endpoint**: `http://localhost:5000/metrics`

To shut down all services:
```bash
docker compose --profile observability down
```


---

### Option 2: Local Development Setup

#### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/ParthJoshi19/Canteenqueuemanagementapp.git
cd Canteenqueuemanagementapp

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 2. Configure Environment Variables

Create `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/canteen
JWT_SECRET=super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173

# Optional: Payment Gateway Keys
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
STRIPE_SECRET_KEY=your_stripe_secret_key

# Optional: AWS S3 Image Upload
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_canteen_bucket
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

#### 3. Database Migration & Seed Data

Make sure PostgreSQL is running and the `canteen` database exists. From the `backend/` directory:

```bash
# Run database migrations
npm run migrate

# Seed initial menu catalog
npm run seed

# Seed default administrator account
npm run seed:admin
```

> **Default Seed Accounts:**
> - **Admin**: Username: `admin` | Password: `admin123`
> - **Student**: You can register a new account on the signup screen.

#### 4. Launch Development Servers

Open two terminal windows:

```bash
# Terminal 1 - Backend Server
cd backend
npm run dev
# Running on http://localhost:5000
```


```bash
# Terminal 2 - Frontend Application
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## 📡 API Reference Summary

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Log in and receive HTTP-only session cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Fetch currently authenticated user session |

### Menu (`/api/menu`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/menu` | List all active menu items |
| `GET` | `/api/menu/:id` | Get single menu item details |

### Orders & Queue (`/api/orders`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/orders` | Place a new order & obtain sequential queue number |
| `GET` | `/api/orders` | List orders for the authenticated user |
| `GET` | `/api/orders/:id` | Get live status and wait time for a specific order |
| `GET` | `/api/orders/queue/info` | Get general queue stats (queue depth, average wait time) |
| `GET` | `/api/orders/queue/all` | List active queue orders (pending, preparing, ready) |
| `GET` | `/api/orders/queue/position` | Get authenticated user's exact position in queue |

### Event Catering (`/api/event-orders`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/event-orders` | Submit a new bulk event catering request |
| `GET` | `/api/event-orders` | List authenticated user's event orders |
| `GET` | `/api/event-orders/:id` | Get specific event order details |

### Payments (`/api/payments`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/payments/razorpay/order` | Initialize a Razorpay payment order |
| `POST` | `/api/payments/razorpay/verify` | Verify Razorpay payment signature |
| `POST` | `/api/payments/stripe/create-intent` | Create a Stripe PaymentIntent |

### Admin Operations (`/api/admin`) *(Requires Admin Role)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/orders` | Get all orders with full status and payment details |
| `PATCH` | `/api/admin/orders/:id/status`| Update order status (`pending` ➔ `preparing` ➔ `ready` ➔ `completed`) |
| `POST` | `/api/admin/menu` | Create a new menu item |
| `PUT` | `/api/admin/menu/:id` | Update an existing menu item |
| `DELETE`| `/api/admin/menu/:id` | Remove a menu item |
| `GET` | `/api/admin/event-orders` | View and manage all bulk event orders |
| `PATCH` | `/api/admin/event-orders/:id/status`| Update event catering status |

### System & Health Checks
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/live` | Process liveness probe |
| `GET` | `/api/ready` | Database connection readiness probe |
| `GET` | `/api/health` | Comprehensive application health status |
| `GET` | `/metrics` | Prometheus metrics export endpoint |
---

## 📊 Monitoring, Observability & SRE (Grafana, Prometheus, Loki, Tempo)

The application includes an end-to-end cloud-native observability stack configured under the `observability` profile in Docker Compose, designed to meet production Site Reliability Engineering (SRE) standards:

```
                  ┌──────────────────────────────┐
                  │   Backend API (/metrics)     │
                  └──────┬───────────────┬───────┘
                         │ (Scrapes:15s) │ (Traces: Zipkin/W3C)
                         ▼               ▼
           ┌─────────────────┐     ┌──────────────┐
           │   Prometheus    │     │ Grafana Alloy│◄── (Docker Logs)
           └────────┬────────┘     └───┬───────┬──┘
                    │                  │Logs   │Traces
                    │                  ▼       ▼
                    │             ┌────────┐ ┌────────┐
                    │             │  Loki  │ │ Tempo  │
                    ▼             └───┬────┘ └───┬────┘
           ┌──────────────────────────▼──────────▼────┐
           │           Grafana Dashboard              │
           │        (http://localhost:3000)           │
           └──────────────────────────────────────────┘
```

### 1. Grafana Dashboards & Visualization (`http://localhost:3000`)
- **Automated Provisioning**: Pre-configured dashboards are automatically provisioned on startup from [`observability/grafana/dashboards/canteen-overview.json`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/observability/grafana/dashboards/canteen-overview.json).
- **Service Overview Dashboard**:
  - Real-time HTTP request throughput and response code breakdown (`2xx`, `4xx`, `5xx`).
  - Request latency percentiles ($p_{50}$, $p_{95}$, $p_{99}$).
  - In-flight request volume, process memory (RSS), and uptime.
- **Log & Trace Exploration**: In Grafana **Explore**, seamlessly query logs via **Loki** and correlate request trace IDs with span waterfalls in **Tempo**.

### 2. Prometheus Metrics & Alerting (`http://localhost:9090`)
- **Telemetry Scraping**: Prometheus pulls metrics from the backend `/metrics` endpoint every 15 seconds.
- **Production Alert Rules** ([`observability/prometheus/alerts.yml`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/observability/prometheus/alerts.yml)):
  - `CanteenApiDown`: Triggers immediately if the backend scrape target fails for more than 1 minute.
  - `CanteenHighErrorRate`: Fires if 5xx server errors exceed 5% of business API traffic over 5 minutes.
  - `CanteenLatencyHigh`: Warns if over 5% of requests exceed the 500 ms SLA threshold over 5 minutes.

### 3. Structured Logging (Loki) & Distributed Tracing (Tempo)
- **Grafana Alloy Collector**: Tails container stdout/stderr directly from the Docker socket and forwards formatted telemetry.
- **Structured Access Logs (Loki)**: API access logs are structured JSON containing request method, route template, HTTP status, execution latency, and trace ID.
- **Distributed Request Tracing (Tempo)**: Tracks request life cycles using W3C `traceparent` headers and emits spans to Tempo for debugging slow database queries or checkout bottlenecks.

### 4. Service-Level Objectives (SLOs) & Error Budgets
As detailed in [`observability/OPERATIONS.md`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/observability/OPERATIONS.md):
- **Availability SLO**: **99.5%** over a rolling 30-day window (30-day error budget: ~3 hours 36 minutes).
- **Latency SLO**: **95%** of business API requests served within **500 ms**.

**Starter PromQL Queries for SLO Tracking:**
```promql
# 30-Day Availability (excluding internal health checks)
1 - (
  sum(increase(canteen_http_requests_total{status_code=~"5..",route!~"/api/(health|ready|live)"}[30d]))
  /
  clamp_min(sum(increase(canteen_http_requests_total{route!~"/api/(health|ready|live)"}[30d])), 1)
)

# 30-Day Latency (% of requests < 500ms)
sum(increase(canteen_http_request_duration_seconds_bucket{le="0.5",route!~"/api/(health|ready|live)"}[30d]))
/
clamp_min(sum(increase(canteen_http_request_duration_seconds_count{route!~"/api/(health|ready|live)"}[30d])), 1)
```

> For step-by-step incident response procedures, triaging guidelines, and postmortem templates, see [`observability/OPERATIONS.md`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/observability/OPERATIONS.md).

---

## 🚢 Deployment & CI/CD

- **GitHub Actions (`.github/workflows/deploy.yml`)**:
  - Automatically runs backend tests, TypeScript validation, and frontend production builds on pull requests.
  - Builds and pushes multi-stage Docker images to **GitHub Container Registry (GHCR)** on merges to `main`.
  - Performs SSH deployment: pulls new images, applies database migrations, restarts containers, and verifies readiness.
  - Scheduled health probe monitors `/api/health` every 10 minutes.
- **Kubernetes Manifests (`k8s/`)**:
  - Includes configurations for PostgreSQL, Redis, Backend, Frontend Ingress, and **Horizontal Pod Autoscaler (HPA)** for scaling pods during campus peak meal hours.

---

## 📁 Repository Directory Structure

```
Canteenqueuemanagementapp/
├── backend/
│   ├── Dockerfile             # Production container definition
│   ├── db/
│   │   └── migrations/        # SQL migration scripts (schema, payments, event orders)
│   ├── src/
│   │   ├── config/            # Database pool & environment configuration
│   │   ├── middleware/        # JWT auth & role authorization middleware
│   │   ├── models/            # PostgreSQL data access models (User, Order, MenuItem, EventOrder)
│   │   ├── routes/            # Express route handlers (auth, menu, orders, payments, admin)
│   │   ├── seed/              # Seed scripts for menu items and admin user
│   │   ├── scripts/           # Migration executor
│   │   └── server.ts          # Server entry point & Prometheus telemetry
│   └── package.json
├── frontend/
│   ├── Dockerfile             # Multi-stage build with Nginx reverse proxy
│   ├── nginx.conf             # Nginx routing configuration
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # UI components (Cart, MenuCard, AdminDashboard, OrderTracking, etc.)
│   │   │   ├── lib/           # API fetch helpers and utilities
│   │   │   └── App.tsx        # Main application state and routing
│   │   └── main.tsx
│   └── package.json
├── k8s/                       # Kubernetes deployment, service, ingress, and HPA manifests
├── observability/             # Full SRE & Monitoring Stack
│   ├── OPERATIONS.md          # SRE runbook, SLO targets, PromQL queries, incident response
│   ├── grafana/               # Grafana dashboards & datasource provisioning
│   │   ├── dashboards/        # Pre-built Canteen Service Overview dashboard
│   │   └── provisioning/      # Datasource configs for Prometheus, Loki, Tempo
│   ├── prometheus/            # Prometheus scraping config & alert rules (alerts.yml)
│   ├── loki/                  # Loki configuration for log stream storage
│   ├── tempo/                 # Tempo configuration for distributed tracing
│   └── alloy/                 # Grafana Alloy telemetry collector config
├── docker-compose.yml         # Local & staging multi-container orchestration
├── CI_CD.md                   # Detailed CI/CD workflow documentation
└── README.md                  # Project documentation
```

## 📄 License
This project is licensed under the MIT License.