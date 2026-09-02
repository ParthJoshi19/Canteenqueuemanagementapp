# 🍽️ Distributed Canteen Queue Management System

A full-stack distributed canteen ordering and queue management system built to demonstrate **Distributed Systems Concepts (Units I, II, III, and IV)** alongside a full-featured user experience for students and canteen administrators.

---

## 🎯 Why Distributed Systems (DS) Concepts are Needed in this Project

In a real-world university campus, thousands of students rush to the canteen during peak hours (e.g., lunch breaks). A traditional monolithic application backed by a single server and database suffers from catastrophic bottlenecks, single points of failure, uncoordinated state updates, and latency spikes.

This project uses core **Distributed Systems (DS)** principles to solve these real-world engineering challenges:

| DS Topic & Concept | Syllabus Module | Why It is Needed (Problem Solved) | Canteen Application Use Case | Code Location |
| :--- | :--- | :--- | :--- | :--- |
| **Microservices Topology** | **Unit 1** | Prevents system-wide outages when a single background task fails. | Decouples `order-service`, `queue-service`, `kitchen-service`, and `notification-worker`. A surge in SMS alerts won't crash checkout. | [`docker-compose.yml`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/docker-compose.yml) |
| **Virtualization & Containers** | **Unit 1** | Guarantees environmental consistency and independent service scaling. | Packages each service in Docker containers. Allows scaling `queue-service` to 5 pods during campus rush hour via Kubernetes HPA. | [`Dockerfile.service`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/Dockerfile.service) |
| **Distributed Multimedia & QoS** | **Unit 1** | Manages streaming bandwidth and latency under variable network conditions. | Streams live canteen kitchen camera feeds to student phones. Automatically adapts resolution (1080p $\rightarrow$ 480p) during campus Wi-Fi congestion. | [`multimediaStream.ts`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/src/communication/multimediaStream.ts) |
| **Synchronous RPC** | **Unit 2** | Ensures real-time synchronous verification before financial transactions. | `Order Service` issues an RPC to `Kitchen Service` (`checkCapacity()`, `reserveStock()`) before taking payment for meal items. | [`rpc.ts`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/src/communication/rpc.ts) |
| **Message-Oriented Pub/Sub** | **Unit 2** | Asynchronously processes non-blocking event workflows. | `Order Service` publishes `ORDER_CREATED` to Redis Pub/Sub; kitchen printers and notification workers consume events asynchronously. | [`eventBus.ts`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/src/communication/eventBus.ts) |
| **Stream-Oriented SSE** | **Unit 2** | Eliminates wasteful HTTP polling from hundreds of mobile client screens. | Server-Sent Events (SSE) push live queue position changes and wait time countdowns continuously to student phones. | [`streamServer.ts`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/src/communication/streamServer.ts) |
| **Peer-to-Peer (P2P) Gossip** | **Unit 2** | Decentralizes counter communication without single-point database bottlenecks. | Canteen counters (Main Counter, Beverage Bar, Bakery, VIP Catering) gossip queue versions directly to peer nodes for anti-entropy sync. | [`p2pGossip.ts`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/src/communication/p2pGossip.ts) |
| **WebRTC P2P Data Channels** | **Unit 2** | Achieves zero-latency direct communication between devices. | Establishes direct P2P data channels between student phones and kitchen counter display screens for instant pickup number sync. | [`webrtcSignaling.ts`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/src/communication/webrtcSignaling.ts) |
| **Lamport Logical Clocks** | **Unit 3** | Establishes a total ordering of events without relying on synchronized physical clocks. | Assigns logical timestamps $L = \max(L_{local}, L_{remote}) + 1$ to sequence order creation and state transitions across separate servers. | [`lamportClock.ts`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/src/ds/lamportClock.ts) |
| **Vector Clocks** | **Unit 3** | Tracks causal dependencies and identifies concurrent state conflicts. | Vector clock tuples `[OrderService, QueueService, KitchenService]` detect concurrent modifications to orders across distributed nodes. | [`vectorClock.ts`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/src/ds/vectorClock.ts) |
| **Bully Leader Election** | **Unit 3** | Ensures exactly one primary coordinator manages queue numbering at all times. | Elects the active QueueWorker with the highest Process ID as Coordinator; triggers automatic election when a primary node crashes. | [`leaderElection.ts`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/src/ds/leaderElection.ts) |
| **Ricart-Agrawala Mutex** | **Unit 3** | Prevents race conditions and double prep work in multi-chef kitchens. | Grants exclusive critical section locks for order preparation so two chefs at different kitchen stations never prepare the same order. | [`mutualExclusion.ts`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/backend/src/ds/mutualExclusion.ts) |
| **Kubernetes & HPA** | **Unit 4** | Provides production elasticity and self-healing infrastructure. | Automatically scales queue service pods based on CPU/RAM load thresholds and routes traffic via K8s Ingress rules. | [`k8s/`](file:///c:/Users/parth/Ddrive/Code-2/Canteenqueuemanagementapp/k8s) |

---

## 🚀 Quick Start Guide

### Option A: Run via Docker Compose (Recommended)

Run all microservices (`Order Service`, `Queue Service`, `Kitchen Service`, `Notification Worker`), `Backend Gateway`, `Frontend`, `PostgreSQL`, and `Redis` in isolated containers with a single command:

```bash
docker-compose up --build -d
```

- **Frontend App**: `http://localhost` (or `http://localhost:5173`)
- **Backend API Gateway**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`
- **Redis Pub/Sub**: `localhost:6379`

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
PORT=5000
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/canteen
JWT_SECRET=super-secret-jwt-key
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
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

## 🔬 Detailed Feature & Syllabus Breakdown (Units I – IV)

### 🟢 Unit I – Introduction to Distributed Systems & Virtualization

#### 1. Microservices Topology & EAI (`backend/Dockerfile`, `docker-compose.yml`)
- **Intention & Need**: Decouples high-volume customer ordering (`order-service`) from kitchen food preparation (`kitchen-service`), queue computation (`queue-service`), and student notification workers (`notification-service`). If the notification worker crashes, students can still place orders without system-wide outage.
- **Syllabus Concept**: Definition, Goals (Resource Sharing, Openness, Scalability, Fault Tolerance), Types of Distributed Systems (Distributed Information Systems / Enterprise Application Integration).

#### 2. Virtualization & Containerization (`Dockerfile`, `docker-compose.yml`, `.dockerignore`)
- **Intention & Need**: Packages each microservice into lightweight isolated containers ensuring identical OS runtime dependencies across development, staging, and production environments. A root `.dockerignore` optimizes context transfer speed down to ~600KB.
- **Syllabus Concept**: Role of Virtualization in Distributed Systems, Hypervisors vs Containers.

#### 3. Distributed Multimedia System & QoS Controller (`backend/src/communication/multimediaStream.ts`)
- **Intention & Need**: Streams continuous live video feeds of the kitchen prep counter and pickup area to student mobile apps with Quality of Service (QoS) guarantees. Automatically lowers video resolution (1080p HD $\rightarrow$ 480p Low) during network congestion / high packet loss to prevent video stuttering.
- **Syllabus Concept**: Distributed Multimedia Systems, Continuous Media Streams, Quality of Service (QoS) metrics (Jitter Buffer, Latency, Packet Loss, Adaptive Bitrate Allocation).

---

### 🔵 Unit II – Inter-Service Communication

#### 1. Synchronous Remote Procedure Call (RPC) (`backend/src/communication/rpc.ts`)
- **Intention & Need**: Allows `order-service` to synchronously invoke `kitchen-service.checkCapacity()` and `reserveStock()` before accepting payment. Ensures item availability in real time with client/server stubs and JSON parameter marshaling.
- **Syllabus Concept**: Remote Procedure Call (RPC) Framework, Client/Server Stubs, Parameter Marshaling, Execution Latency Tracking.

#### 2. Message-Oriented Communication (Event Bus & Pub/Sub) (`backend/src/communication/eventBus.ts`)
- **Intention & Need**: Decouples services asynchronously. When an order is placed, `order-service` publishes an `ORDER_CREATED` event to Redis Pub/Sub; `kitchen-service` and `notification-service` asynchronously process food prep and SMS alerts without blocking the student's checkout UI.
- **Syllabus Concept**: Message-Oriented Middleware (MOM), Topic-based Publish/Subscribe Broker, Asynchronous Fire-and-Forget.

#### 3. Stream-Oriented Communication (Server-Sent Events) (`backend/src/communication/streamServer.ts`)
- **Intention & Need**: Pushes real-time order queue updates, estimated prep time countdowns, and algorithm state snapshots continuously over a single persistent HTTP connection to student screens.
- **Syllabus Concept**: Stream-Oriented Communication, Server-Sent Events (SSE), Persistent HTTP Streaming.

#### 4. Peer-to-Peer (P2P) Messaging (Gossip Protocol) (`backend/src/communication/p2pGossip.ts`)
- **Intention & Need**: Decentralized canteen counter nodes (`Main Counter`, `Beverage Counter`, `Bakery Bar`, `Catering Counter`) gossip local order queue versions and item stock directly with peer counters without relying on a central database server. Demonstrates anti-entropy state convergence.
- **Syllabus Concept**: Unstructured Peer-to-Peer (P2P) Messaging, Gossip Protocol (Anti-Entropy Rumor Spreading), State Convergence.

#### 5. WebRTC Peer-to-Peer Signaling & Data Channels (`backend/src/communication/webrtcSignaling.ts`)
- **Intention & Need**: Establishes direct P2P data channels between student mobile apps and kitchen counter display screens for live status sync and low-latency P2P video stream of order pickup numbers without relaying frames through central servers.
- **Syllabus Concept**: WebRTC, SDP Offer/Answer Signaling, ICE Candidate Traversal, P2P Data Channels.

#### 6. Flat Identifiers & Fault Tolerance (`backend/src/ds/leaderElection.ts`)
- **Intention & Need**: Uses UUID v4 flat naming (`EVT-...`, `RPC-...`) and Docker internal DNS resolution (`canteen-postgres`, `canteen-backend`). Handles process crashes with Bully algorithm coordinator failover and container auto-restart policies.
- **Syllabus Concept**: Names, Identifiers & Addresses, Process Resilience, Crash-Recovery Failure Models.

---

### 🟡 Unit III – Synchronization & Core DS Algorithms

#### 1. Lamport Logical Clocks (`backend/src/ds/lamportClock.ts`)
- **Intention & Need**: Enforces total ordering of inter-service messages with rule $L_{recv} = \max(L_{local}, L_{remote}) + 1$.
- **Syllabus Concept**: Logical Clocks, Total Event Ordering.

#### 2. Vector Clocks (`backend/src/ds/vectorClock.ts`)
- **Intention & Need**: Tracks causal dependencies and detects concurrent order modifications across distributed nodes using vector tuples `[OrderService, QueueService, KitchenService]`.
- **Syllabus Concept**: Vector Clocks, Causal Ordering, Concurrency Detection.

#### 3. Leader Election (Bully Algorithm) (`backend/src/ds/leaderElection.ts`)
- **Intention & Need**: Elects the active QueueWorker process with the highest Process ID as Primary Coordinator; re-elects automatically upon simulated node crashes.
- **Syllabus Concept**: Distributed Leader Election, Bully Algorithm.

#### 4. Distributed Mutual Exclusion (Ricart-Agrawala) (`backend/src/ds/mutualExclusion.ts`)
- **Intention & Need**: Grants exclusive critical section locks for order preparation to prevent race conditions where two kitchen chefs attempt to prepare the same order simultaneously.
- **Syllabus Concept**: Distributed Mutual Exclusion, Ricart-Agrawala Algorithm.

---

### 🟣 Unit IV – Emerging Distributed Paradigms

- **Distributed Storage & Caching**: PostgreSQL for persistence + Redis for fast distributed state & pub/sub.
- **Serverless Simulation**: Asynchronous event handler simulating AWS Lambda for notification dispatch.
- **Kubernetes Orchestration**: Production-ready k8s manifests with HPA and ingress rules in `k8s/`.

---

## 🖥️ Interactive DS Inspector UI

The application includes an interactive **Distributed Systems Inspector** built into the frontend header navbar!

1. Open `http://localhost` (or `http://localhost:5173`) in your browser.
2. Click the purple **DS Inspector** button in the header.
3. Interactively test:
   - **P2P Gossip Network**: Trigger gossip rounds and watch peer queue state convergence across counter nodes.
   - **WebRTC P2P Channel**: Test SDP offer/answer signaling and P2P data channels.
   - **Multimedia Stream & QoS**: Monitor continuous streaming FPS, Jitter Buffer, Packet Loss simulation, and Adaptive Bitrate controls.
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
│   │   ├── communication/       # Unit I & II: RPC, Event Bus, SSE Stream, P2P Gossip, WebRTC, Multimedia QoS
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
├── .dockerignore                # Optimized Docker build context filter
└── README.md
```
