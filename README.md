# Distributed Canteen Queue Management System

A full-stack distributed canteen ordering and queue management system built to demonstrate **Distributed Systems Concepts (Units I, II, III, and IV)** alongside a full user experience for students and admins.

---

## 🚀 Quick Start Guide

### Option A: Run via Docker Compose (Recommended for Distributed Systems Demo)

Run all microservices (`Order Service`, `Queue Service`, `Kitchen Service`, `Notification Worker`), PostgreSQL, and Redis in isolated containers with a single command:

```bash
docker-compose up --build
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`
- **Order Service**: `http://localhost:3001`
- **Queue Service**: `http://localhost:3002`
- **Kitchen Service**: `http://localhost:3003`

---

### Option B: Run Locally in Development Mode

#### 1. Install Dependencies
```bash
cd backend
npm install

cd ../frontend
npm install
```

#### 2. Set Up Environment Variables

Create `backend/.env`:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/canteen
JWT_SECRET=super-secret-jwt-key
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

#### 3. Run Database Migrations & Seeds
From `backend/`:
```bash
npm run migrate
npm run seed
npm run seed:admin
```

#### 4. Launch Services
```bash
# Terminal 1 - Backend API & DS Engine
cd backend
npm run dev

# Terminal 2 - Frontend App
cd frontend
npm run dev
```

---

### Option C: Deploy to Kubernetes (Unit IV)

Deploy microservices with Horizontal Pod Autoscaling (HPA) and Ingress:

```bash
kubectl apply -f k8s/postgres-redis.yaml
kubectl apply -f k8s/microservices.yaml
kubectl apply -f k8s/ingress-hpa.yaml
```

---

## 🔬 Distributed Systems Features (Units I – IV)

### 🟢 Unit I – Introduction to Distributed Systems & Virtualization
- **Microservices Topology**: Decoupled services (`order-service`, `queue-service`, `kitchen-service`, `notification-service`).
- **Containerization**: Multi-stage `Dockerfile.service` and `docker-compose.yml` for isolated service execution.

### 🔵 Unit II – Inter-Service Communication
- **Remote Procedure Call (RPC)**: Synchronous inter-service RPC framework (`checkCapacity()`, `reserveStock()`).
- **Message-Oriented Communication**: Event-driven Pub/Sub broker broadcasting `ORDER_CREATED` and `ORDER_STATUS_CHANGED`.
- **Stream-Oriented Communication**: Real-time Server-Sent Events (SSE) stream (`/api/ds/stream`) pushing queue and algorithm updates to the UI.

### 🟡 Unit III – Synchronization & Core DS Algorithms
- **Lamport Logical Clocks**: Enforces total ordering of inter-service messages with rule $L_{recv} = \max(L_{local}, L_{remote}) + 1$.
- **Vector Clocks**: Vector clock tuples `[OrderService, QueueService, KitchenService]` tracking causal dependencies and concurrent updates.
- **Leader Election (Bully Algorithm)**: Elects the highest-ID active QueueWorker process as Primary Coordinator. Includes node crash/recovery triggers.
- **Distributed Mutual Exclusion (Ricart-Agrawala Algorithm)**: Grants exclusive critical section locks for order preparation to prevent double processing across kitchen stations.

### 🟣 Unit IV – Emerging Distributed Paradigms
- **Distributed Storage & Caching**: PostgreSQL for persistence + Redis for fast distributed state & pub/sub.
- **Serverless Simulation**: Asynchronous event handler simulating AWS Lambda for notification dispatch.
- **Kubernetes Orchestration**: Production-ready k8s manifests with HPA and ingress rules in `k8s/`.

---

## 🖥️ Interactive DS Inspector UI

The application includes an interactive **Distributed Systems Inspector** built into the frontend header navbar!

1. Open `http://localhost:5173` in your browser.
2. Click the purple **DS Inspector** button in the header.
3. Interactively test:
   - **Lamport Clock Monitor**: Watch real-time tick counters per service or click **Tick Clock (+1)**.
   - **Vector Clock Matrix**: View vector states and causal relationship comparisons.
   - **Bully Leader Election**: Simulate node crashes or trigger elections.
   - **Ricart-Agrawala Mutex**: Request or release order preparation locks across simulated kitchen stations.
   - **RPC Execution Console**: Issue synchronous inter-service calls and view execution time logs.

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── Dockerfile.service       # Multi-stage container file for microservices
│   ├── src/
│   │   ├── ds/                  # Unit III: Lamport, Vector Clocks, Bully Election, Mutex
│   │   ├── communication/       # Unit II: RPC, Message Bus, SSE Stream Server
│   │   ├── routes/              # Express API Routes & DS Endpoints (/api/ds)
│   │   └── server.ts            # Entrypoint
├── frontend/
│   ├── src/
│   │   ├── app/components/
│   │   │   ├── DsInspector.tsx  # Interactive DS Visual Dashboard
│   │   │   ├── header.tsx       # Header with DS Inspector Trigger
│   │   │   └── App.tsx          # Main React Application
├── k8s/                         # Unit IV: Kubernetes manifests (HPA, Ingress, Deployments)
├── docker-compose.yml           # Unit I: Docker Compose Multi-Container Orchestration
└── README.md
```
