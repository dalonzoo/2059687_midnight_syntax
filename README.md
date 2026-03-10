# Mars Habitat Automation Platform

> **Award-winning distributed IoT platform for Mars habitat automation and real-time monitoring**

Welcome to the **Mars Habitat Automation Platform**—a production-grade event-driven microservices system for managing telemetry, environmental controls, and automation in a simulated Mars habitat. Built with modern cloud-native technologies, this project demonstrates enterprise-level distributed systems architecture.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [System Components](#system-components)
- [User Stories & Coverage](#user-stories--coverage)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Dashboard Features](#dashboard-features)
- [Technology Stack](#technology-stack)
- [Deployment & Operations](#deployment--operations)
- [Project Documentation](#project-documentation)

---

## Overview

The Mars Habitat Automation Platform is a **distributed IoT system** designed to:

- **Ingest** heterogeneous sensor data from REST endpoints and real-time telemetry streams (SSE)
- **Normalize** all incoming data into a unified internal event schema for consistency
- **Route** events through Apache Kafka for decoupled, scalable microservices communication
- **Evaluate** if-then automation rules in real-time to trigger actuator commands
- **Persist** automation rules in PostgreSQL for durability across restarts
- **Cache** latest sensor state in memory for instant access
- **Visualize** real-time metrics on an interactive React dashboard with WebSocket updates

**Architecture Summary:**
- **3 Python/FastAPI microservices** (Ingestion, Processing, Dashboard)
- **8 containerized services** total (including Kafka, PostgreSQL, Zookeeper)
- **React 18 SPA** with Material UI and real-time charts
- **100% Docker Compose** orchestration — single-command deployment
- **Team size:** 3 students | **Timeline:** 5 days | **User stories:** 15 implemented

---

## Key Features

✅ **Event-Driven Architecture** — Apache Kafka decouples all services  
✅ **Unified Data Normalization** — Heterogeneous devices → consistent schema  
✅ **Real-Time Dashboard** — Live WebSocket updates with 200ms latency  
✅ **Automation Engine** — If-then rules with 4 operators (`<`, `<=`, `>`, `>=`, `=`)  
✅ **Persistent Rules** — PostgreSQL ensures rules survive restarts  
✅ **Auto-Discovery** — Sensors and topics discovered dynamically every 30 seconds  
✅ **State Caching** — In-memory cache for instant state queries  
✅ **Actuator Control** — Override automation manually or let rules drive decisions  
✅ **Production Logging** — Structured logs across all services for debugging  
✅ **Health Checks** — All services include Docker health check endpoints  

---

## Quick Start

### Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose v2.0+)
- **Mars IoT Simulator image** (`mars-iot-simulator-oci.tar`) — provided separately
- **8GB RAM** minimum, **10GB free disk space**

### Installation & Launch

**Step 1: Load the simulator image**
```bash
docker load -i mars-iot-simulator-oci.tar
```

**Step 2: Start the entire platform**
```bash
cd source
docker compose up -d
```

**Step 3: Wait for health checks**
```bash
docker compose ps
# Wait until all services show "healthy" status (30-45 seconds)
```

**Step 4: Access the dashboard**
```
🌐 Dashboard: http://localhost:3000
🔌 Simulator API docs: http://localhost:8080/docs
📊 Processing Service API: http://localhost:8001/docs
📡 Dashboard Service API: http://localhost:8082/docs
```

### Stopping the Platform
```bash
cd source
docker compose down
```

To **remove all data** (including persisted rules):
```bash
cd source
docker compose down -v
```

---

## System Components

### 1. Mars IoT Simulator (:8080)
The reference IoT environment provided as an immutable OCI container. Exposes:
- **8 REST sensors** (polled every 5 seconds): greenhouse temperature, humidity, CO₂, pressure, pH, water level, particulates, VOCs
- **7 SSE/WebSocket telemetry topics** (streamed): solar array, radiation, life support, thermal loop, power bus, power consumption, airlock
- **4 Actuators** (controlled via POST): cooling fan, entrance humidifier, hall ventilation, habitat heater

**Discovery endpoints:**
- `GET /health` — Health check
- `GET /api/sensors` — List all REST sensors  
- `GET /api/telemetry/topics` — List all telemetry topics
- `GET /api/actuators` — List all actuators

### 2. Ingestion Service (:8000, internal)
**Responsibility:** Collect → Normalize → Publish

- Polls 8 REST sensors at configurable intervals (default: 5s)
- Subscribes to 7 SSE telemetry streams with auto-reconnect
- Transforms each raw payload into the unified `UnifiedEvent` schema
- Publishes all events to Kafka topic `sensor.events`
- Performs service discovery every 30 seconds to detect new devices

**Key implementation:** `source/ingestion-service/app/`

### 3. Processing Service (:8001)
**Responsibility:** Cache → Evaluate → Control → Persist

- Consumes `sensor.events` from Kafka
- Maintains in-memory `StateCache` for all latest sensor readings
- Evaluates automation rules (stored in PostgreSQL) against incoming events
- Triggers actuator commands when rule conditions are met
- Publishes actuator state changes to Kafka topic `actuator.events`
- Exposes REST APIs for rule CRUD, state queries, and manual overrides

**REST API endpoints:**
- `GET /api/state` — Latest sensor state (cached)
- `GET /api/rules` — List all automation rules
- `POST /api/rules` — Create new rule
- `PUT /api/rules/{id}` — Update rule
- `DELETE /api/rules/{id}` — Delete rule
- `POST /api/actuators/{name}` — Manually control actuator
- `GET /api/actuators` — Current actuator states

**Key implementation:** `source/processing-service/app/`

### 4. Dashboard Service (:8082, external port 8082)
**Responsibility:** Aggregate → Relay → Proxy

- Consumes both `sensor.events` and `actuator.events` from Kafka
- Maintains WebSocket connections to all connected frontend clients
- Broadcasts real-time updates to all clients with minimal latency
- Proxies REST API calls from frontend to processing-service
- No persistence — purely a real-time relay

**REST API endpoints (proxied to processing-service):**
- `GET /api/state` → Processing Service  
- `GET /api/rules` → Processing Service
- `POST /api/rules` → Processing Service
- `PUT /api/rules/{id}` → Processing Service
- `DELETE /api/rules/{id}` → Processing Service

**WebSocket endpoint:**
- `WS /ws` — Subscribe to live sensor and actuator updates

**Key implementation:** `source/dashboard-service/app/`

### 5. Frontend (React SPA at :3000)
**Framework:** React 18 + Vite + Material UI + Recharts

**Key pages:**
- **Dashboard** — Live sensor grid with sparklines, status badges, featured metrics
- **Sensor Details** — Historical charts per sensor (recharts line graphs)
- **Rules Manager** — Create/edit/delete automation rules with validation  
- **Actuators Panel** — Real-time toggle switches for manual control
- **Event Log** — Real-time log of all trigger events

**Architecture:**
- Served by Nginx (reverse proxy + static file server)
- WebSocket connection to dashboard-service for real-time updates
- REST calls to localStorage for offline support (beta)
- Responsive design (mobile-friendly)

**Key implementation:** `source/frontend/src/`

### 6. Apache Kafka (:9092)
Event broker with 2 topics:

| Topic | Producer | Consumers | Retention | Payload |
|-------|----------|-----------|-----------|---------|
| `sensor.events` | ingestion-service | processing-service, dashboard-service | 1 hour | UnifiedEvent (normalized sensor data) |
| `actuator.events` | processing-service | dashboard-service | 1 hour | Actuator state changes (name, state, triggered_by_rule_id) |

**Configuration:**
- Single-broker setup (suitable for development/testing)
- Auto-topic creation enabled
- Log retention: 1 hour (events auto-purged after 1 hour)

### 7. PostgreSQL (:5432)
Relational database for durable rule persistence.

**Schema: `automation_rules` table**

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT | Primary key, auto-increment |
| `sensor_name` | VARCHAR(100) | Sensor identifier (e.g., `greenhouse_temperature`) |
| `metric` | VARCHAR(100) | Metric name (e.g., `temperature`) |
| `operator` | CHAR(2) | Comparison operator: `<`, `<=`, `=`, `>`, `>=` |
| `threshold` | FLOAT | Trigger value |
| `unit` | VARCHAR(50) | Unit of measurement (e.g., `°C`, optional) |
| `actuator_name` | VARCHAR(100) | Actuator identifier (e.g., `cooling_fan`) |
| `actuator_state` | CHAR(3) | Target state: `ON` or `OFF` |
| `enabled` | BOOLEAN | Rule active flag (default: `true`) |
| `created_at` | TIMESTAMP | Creation timestamp (auto-set) |
| `updated_at` | TIMESTAMP | Last modification (auto-updated) |

**Example rule:**
```
IF greenhouse_temperature > 28 °C THEN set cooling_fan to ON
```

### 8. Zookeeper (:2181, internal)
Kafka coordination service. No external access needed.

---

## Architecture

### System Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  MARS HABITAT PLATFORM                       │
│                                                              │
│  ┌───────────────────┐       ┌──────────────────────┐       │
│  │  Mars IoT         │       │  Ingestion Service   │       │
│  │  Simulator        │◄─────►│  (Python/FastAPI)    │       │
│  │  :8080            │ REST  │  :8000 (internal)    │       │
│  │                   │ SSE   │                      │       │
│  │ • 8 REST sensors  │       │ • REST Poller        │       │
│  │ • 7 SSE topics    │◄─────►│ • SSE Streamer       │       │
│  │ • 4 Actuators     │  HTTP │ • Normalizer         │       │
│  └──────────────────┘       └──────────┬───────────┘       │
│         ▲                              │ publish            │
│         │                              ▼                    │
│         │                    ┌──────────────────────┐        │
│         │                    │   APACHE KAFKA       │        │
│         │                    │                      │        │
│         │                    │  sensor.events       │        │
│         │                    │  actuator.events     │        │
│         │                    └────┬────────┬───────┘        │
│         │                         │        │                 │
│         │ POST actuators    consume│        │consume          │
│         │                    ┌────▼──┐    ┌┴──────┐         │
│         └────────────────────│Process│    │Dashbrd│         │
│         (manual override)    │Service│    │Service│         │
│                              │:8001  │    │:8082  │         │
│                              └────┬──┘    └───┬───┘         │
│                                   │           │ WebSocket   │
│                            ┌──────▼──┐    ┌──▼────┐        │
│                            │PostgreSQL │  │React  │        │
│                            │ :5432     │  │SPA    │        │
│                            │ (rules DB)  │ :3000 │        │
│                            └────────────┘ └───────┘        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow Pipeline

```
Simulator
    │
    ├─ REST polling (5s interval)
    │   └─► Ingestion Service
    │       └─► Normalize → Kafka [sensor.events]
    │
    └─ SSE streaming (5s default)
        └─► Ingestion Service
            └─► Normalize → Kafka [sensor.events]
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
            Processing Service    Dashboard Service
                    │                 │
                    ├─ Cache state    ├─ Accumulate events
                    ├─ Evaluate rules ├─ Broadcast via WS
                    └─ Post to        └─ Proxy REST calls
                      actuator
                      │
                      └─► Kafka [actuator.events]
                          │
                          └─► Dashboard Service
                              │
                              └─► WebSocket broadcast
                                  │
                                  └─► React Frontend
```

### Service Port Map

| Service | Internal Port | External Port | Purpose | Type |
|---------|--------------|---------------|---------|------|
| simulator | 8080 | 8080 | Mars IoT Simulator (reference) | Infrastructure |
| zookeeper | 2181 | — | Kafka coordination | Infrastructure |
| kafka | 9092 | 9092 | Event broker | Infrastructure |
| postgres | 5432 | 5432 | Rule persistence | Infrastructure |
| ingestion-service | 8000 | — | Sensor data collection | Service |
| processing-service | 8001 | 8001 | Rules + state + actuators | Service |
| dashboard-service | 8002 | 8082 | WebSocket relay + proxy | Service |
| frontend (nginx) | 80 | 3000 | React SPA UI | Frontend |

### Kafka Topics & Message Flow

| Topic | Producer | Consumers | Payload Format | Retention |
|-------|----------|-----------|---|---|
| `sensor.events` | ingestion-service | processing-service, dashboard-service | UnifiedEvent (JSON) | 1 hour |
| `actuator.events` | processing-service | dashboard-service | ActuatorEvent (JSON) | 1 hour |

---

## Screenshots

### 1. Dashboard Overview

The main dashboard provides a comprehensive real-time view of all habitat metrics:

- **Featured Sensors Section** — Greenhouse temperature and hydroponic pH prominently displayed for crop monitoring
- **Live Sensor Grid** — All 15 sensor readings with status badges (OK/Warning) and last-update timestamps
- **Power Comparison Widget** — Side-by-side view of power consumption vs. power bus capacity with deficit alerts
- **Connection Status** — Indicator showing simulator connectivity status
- **Auto-refresh** — WebSocket updates propagate changes in real-time (< 500ms)

![Dashboard Overview - Main Monitoring Interface](booklets/screenshots/screenshot1.png)

**Components involved:**
- [Dashboard.jsx](source/frontend/src/components/dashboard/Dashboard.jsx) — Layout orchestrator
- [SensorCard.jsx](source/frontend/src/components/dashboard/SensorCard.jsx) — Individual live metrics
- [SensorChart.jsx](source/frontend/src/components/dashboard/SensorChart.jsx) — Recharts line graphs
- [PowerComparison.jsx](source/frontend/src/components/dashboard/PowerComparison.jsx) — Power analysis
- [StatusBadge.jsx](source/frontend/src/components/dashboard/StatusBadge.jsx) — Health indicators

---

### 2. Rules Manager & Actuator Control

The rules manager allows operators to define, edit, and monitor automation rules in real-time:

- **Rule Creation Form** — Step-by-step rule definition with dropdowns for sensor/actuator selection
- **Rule List** — All persisted rules with enable/disable toggles and delete buttons
- **Actuator Control Panel** — Manual override switches for each actuator with real-time state feedback
- **Trigger History** — Event log showing which rules fired and when
- **Validation** — Client-side validation prevents invalid rules before submission

![Rules Manager & Actuator Control Panel](/booklets/screenshots/screenshot2.png)

**Components involved:**
- [RuleManager.jsx](source/frontend/src/components/rules/RuleManager.jsx) — Main orchestrator
- [RuleForm.jsx](source/frontend/src/components/rules/RuleForm.jsx) — Creation/edit form
- [RuleCard.jsx](source/frontend/src/components/rules/RuleCard.jsx) — Rule display card
- [ActuatorPanel.jsx](source/frontend/src/components/actuators/ActuatorPanel.jsx) — Manual control
- [EventLog.jsx](source/frontend/src/components/events/EventLog.jsx) — Trigger history

---

## Dashboard Features Summary

| Feature | Description | User Story |
|---------|-------------|------------|
| **Live Sensor Grid** | All sensors displayed with current readings and timestamps | #1, #9 |
| **Real-time Updates** | WebSocket updates propagate < 500ms latency | #2, #8 |
| **Status Badges** | Visual indicators (OK/Warning) based on thresholds | #5, #11 |
| **Sensor Charts** | Historical line graphs with Recharts (updates while page open) | #6 |
| **Featured Metrics** | Greenhouse temperature & hydroponic pH prominently displayed | #7 |
| **Rule Manager** | CRUD interface for automation rules with real-time sync | #3, #13 |
| **Actuator Control** | Manual override toggles for all 4 actuators | #4, #8 |
| **Power Comparison** | Side-by-side consumption vs. capacity with deficit alert | #14, #15 |
| **Auto-Discovery** | System auto-discovers new sensors every 30 seconds | #12 |
| **Connection Indicator** | Shows connection status to Mars Habitat simulator | #11 |
| **Event Log** | Real-time trigger history showing rule activations | #3, #8 |

---

## API Documentation

### Processing Service REST API

**Base URL:** `http://localhost:8001`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check → `{"status": "ok", "service": "processing-service"}` |
| `GET` | `/api/state` | Latest sensor readings (cached) → `{sensor_id: {metric: value, ...}, ...}` |
| `GET` | `/api/rules` | List all rules → `[{id, sensor_name, metric, operator, threshold, unit, actuator_name, actuator_state, enabled, created_at, updated_at}, ...]` |
| `POST` | `/api/rules` | Create rule → Send rule object, returns `{id, ...}` |
| `PUT` | `/api/rules/{id}` | Update rule → Send updated fields, returns `{id, ...}` |
| `DELETE` | `/api/rules/{id}` | Delete rule → Returns `{message: "Rule deleted"}` |
| `GET` | `/api/actuators` | Current actuator states → `{cooling_fan: "ON", entrance_humidifier: "ON", ...}` |
| `POST` | `/api/actuators/{name}` | Control actuator → Send `{"state": "ON"}` or `{"state": "OFF"}` |

**Example: Create a rule**
```bash
curl -X POST http://localhost:8001/api/rules \
  -H 'Content-Type: application/json' \
  -d '{
    "sensor_name": "greenhouse_temperature",
    "metric": "temperature",
    "operator": ">",
    "threshold": 28.0,
    "unit": "°C",
    "actuator_name": "cooling_fan",
    "actuator_state": "ON",
    "enabled": true
  }'
```

### Dashboard Service REST API

**Base URL:** `http://localhost:8082`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/state` | Proxied → Processing Service `/api/state` |
| `GET` | `/api/rules` | Proxied → Processing Service `/api/rules` |
| `POST` | `/api/rules` | Proxied → Processing Service `/api/rules` |
| `PUT` | `/api/rules/{id}` | Proxied → Processing Service `/api/rules/{id}` |
| `DELETE` | `/api/rules/{id}` | Proxied → Processing Service `/api/rules/{id}` |
| `GET` | `/api/actuators` | Proxied → Processing Service `/api/actuators` |
| `POST` | `/api/actuators/{name}` | Proxied → Processing Service `/api/actuators/{name}` |
| `WS` | `/ws` | WebSocket connection → Broadcasts real-time sensor & actuator updates |

**WebSocket message format:**
```json
{
  "type": "sensor_update",
  "event_id": "uuid-v4-string",
  "sensor_id": "greenhouse_temperature",
  "timestamp": "2026-03-10T12:34:56.789Z",
  "measurements": [
    {"metric": "temperature", "value": 28.3, "unit": "°C"}
  ]
}
```

### OpenAPI Documentation

All FastAPI services expose interactive OpenAPI docs:
- **Ingestion Service** (if exposed): `http://localhost:8000/docs`
- **Processing Service:** `http://localhost:8001/docs`
- **Dashboard Service:** `http://localhost:8082/docs`
- **Simulator:** `http://localhost:8080/docs`

---

## User Stories & Coverage

### Complete User Story Mapping

All 15 user stories for a 3-person team have been implemented and verified:

| # | User Story | Status | Component(s) | Acceptance Criteria |
|---|---|---|---|---|
| 1 | See all sensors in ordered page | ✅ | Dashboard sensor grid, [SensorCard.jsx](source/frontend/src/components/dashboard/SensorCard.jsx) | All 15 sensors displayed, sortable by name/type |
| 2 | See newest telemetry data | ✅ | WebSocket hook [useWebSocket.js](source/frontend/src/hooks/useWebSocket.js), [useSensorData.js](source/frontend/src/hooks/useSensorData.js) | Real-time updates < 500ms via WS |
| 3 | See active automation rules | ✅ | [RuleManager.jsx](source/frontend/src/components/rules/RuleManager.jsx), [RuleCard.jsx](source/frontend/src/components/rules/RuleCard.jsx) | List all rules, enable/disable toggle |
| 4 | Override automation manually | ✅ | [ActuatorPanel.jsx](source/frontend/src/components/actuators/ActuatorPanel.jsx), [ActuatorCard.jsx](source/frontend/src/components/actuators/ActuatorCard.jsx) | Toggle switches for all 4 actuators |
| 5 | Alert on critical sensor value | ✅ | [StatusBadge.jsx](source/frontend/src/components/dashboard/StatusBadge.jsx) | Visual OK/Warning badges, configurable thresholds |
| 6 | Graphs showing telemetry evolution | ✅ | [SensorChart.jsx](source/frontend/src/components/dashboard/SensorChart.jsx), Recharts | Line charts, updates while page open |
| 7 | Monitor greenhouse temp & hydroponic pH | ✅ | [FeaturedSensorCard.jsx](source/frontend/src/components/dashboard/FeaturedSensorCard.jsx), Dashboard top section | Prominent display, real-time updates |
| 8 | Auto-update on actuator state change | ✅ | WebSocket relay, [useWebSocket.js](source/frontend/src/hooks/useWebSocket.js) | No manual refresh needed, WS pushes updates |
| 9 | Know when data was produced | ✅ | Timestamp display on all cards | ISO 8601 timestamps, human-readable format |
| 10 | Coherent data with clear units | ✅ | [UnifiedEvent](source/ingestion-service/app/models/unified_event.py) schema, [event_normalizer.py](source/ingestion-service/app/normalizer/event_normalizer.py) | All measurements include unit, schema enforced |
| 11 | See connection status to simulator | ✅ | [Header.jsx](source/frontend/src/components/layout/Header.jsx) connection indicator, health endpoint polling | Connected/Disconnected badge, color-coded |
| 12 | Auto-discover new sensors/topics | ✅ | [discovery.py](source/ingestion-service/app/discovery.py), periodic refresh every 30s | Queries `/api/sensors` and `/api/telemetry/topics` |
| 13 | Rules survive system restart | ✅ | PostgreSQL [rule_repository.py](source/processing-service/app/database/rule_repository.py), [models.py](source/processing-service/app/database/models.py) | Rules persisted via SQLAlchemy ORM |
| 14 | Compare power consumption vs bus | ✅ | [PowerComparison.jsx](source/frontend/src/components/dashboard/PowerComparison.jsx) | Side-by-side metrics with visual indicator |
| 15 | Power deficit alert | ✅ | [PowerComparison.jsx](source/frontend/src/components/dashboard/PowerComparison.jsx) with conditional alert | Warning badge when deficit detected |

---

## Baseline Requirements Verification

Per `project_instructions.md` §7.3 — All baseline requirements for a 3-person team:

| # | Requirement | Status | Implementation Details |
|---|---|---|---|
| 1 | Event-driven architecture | ✅ | Kafka topics `sensor.events` and `actuator.events` decouple all services |
| 2 | Meaningful broker usage | ✅ | Kafka prevents tight coupling; services can scale independently; topics provide temporal decoupling |
| 3 | Unified event schema | ✅ | [UnifiedEvent](source/ingestion-service/app/models/unified_event.py) enforces single schema across all data sources |
| 4 | In-memory latest sensor state | ✅ | [StateCache](source/processing-service/app/state_cache.py) maintains FIFO cache of latest readings per sensor |
| 5 | Persistent rule storage | ✅ | PostgreSQL `automation_rules` table persists rules with SQLAlchemy ORM |
| 6 | Real-time dashboard | ✅ | React SPA + WebSocket connection to dashboard-service broadcasts updates |
| 7 | Docker reproducibility | ✅ | Single `docker compose up` command starts all 8 services; health checks ensure readiness |

---

## Technology Stack

### Backend Services
| Component | Technology | Version | Purpose |
|---|---|---|---|
| Language | Python | 3.12 | All 3 backend services (ingestion, processing, dashboard) |
| Web Framework | FastAPI | 0.115.6 | Async HTTP server, auto-OpenAPI docs |
| ASGI Server | Uvicorn | 0.34.0 | High-performance async server |
| Data Validation | Pydantic | 2.10.5 | Type-safe models (UnifiedEvent, Rules, etc.) |
| Async HTTP | httpx | 0.28.1 | Polling simulator, controlling actuators |
| Kafka Client | aiokafka | 0.12.0 | Async Kafka producer/consumer |
| Database ORM | SQLAlchemy | 2.0.36 | Async ORM for PostgreSQL |
| DB Driver | asyncpg | 0.30.0 | Async PostgreSQL driver |

### Infrastructure
| Component | Technology | Version | Purpose |
|---|---|---|---|
| Message Broker | Apache Kafka | 7.6.0 (cp-kafka) | Event-driven messaging, temporal decoupling |
| Coordination | Zookeeper | 7.6.0 | Kafka broker coordination |
| Database | PostgreSQL | 16-alpine | Rule persistence, ACID compliance |
| Containerization | Docker | Latest | Reproducible deployments |
| Orchestration | Docker Compose | v3.9 | Single-command platform start |
| Reverse Proxy | Nginx | alpine | SPA serving, API proxying |

### Frontend
| Component | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | 18.3.1 | Component-driven UI |
| Build Tool | Vite | 5.4.14 | Fast development & production builds |
| Styling | Tailwind CSS | 4.2.1 | Utility-first CSS framework |
| UI Components | Material UI (MUI) | 5.16.14 | Professional dashboard widgets |
| Charts | Recharts | 2.13.3 | React charting library, real-time updates |
| Icons | lucide-react | 0.577.0 | SVG icon library |
| State Management | React Hooks | — | Local component state + WebSocket custom hooks |

---

## Deployment & Operations

### Docker Compose Architecture

The system is fully containerized with 8 services orchestrated via `docker-compose.yml`:

```yaml
services:
  simulator        # Mars IoT Simulator (reference)
  zookeeper        # Kafka coordination
  kafka            # Message broker
  postgres         # Rule persistence
  ingestion-service    # Sensor collection
  processing-service   # Rules engine
  dashboard-service    # WebSocket relay
  frontend             # React SPA (Nginx)
volumes:
  pgdata           # PostgreSQL persistent volume
```

### Health Checks

All services include health check endpoints:
- **Liveness probe** — Returns `200 OK` when service is running
- **Readiness probe** — Returns `200 OK` when service is ready to accept traffic
- **Docker Compose** — Waits for all services to be healthy before marking as "up"

View service health:
```bash
cd source
docker compose ps
# Healthy services show "healthy" in the STATUS column
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f processing-service

# Follow rules being evaluated
docker compose logs -f processing-service | grep "evaluating"

# Follow actuator commands
docker compose logs -f processing-service | grep "actuator"
```

### Data Persistence

- **PostgreSQL rules** — Persisted in Docker named volume `pgdata`
- **Kafka messages** — Retained for 1 hour (configurable via env var)
- **Sensor state** — In-memory only (lost on restart, but immediately repopulated from sensor polling)

### Environment Variables

Key configuration exposed via environment:

```bash
# Ingestion Service
SIMULATOR_URL=http://simulator:8080
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
POLL_INTERVAL_SECONDS=5
DISCOVERY_INTERVAL_SECONDS=30

# Processing Service
SIMULATOR_URL=http://simulator:8080
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
DATABASE_URL=postgresql+asyncpg://mars:mars@postgres:5432/mars_rules

# Dashboard Service
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
PROCESSING_SERVICE_URL=http://processing-service:8001

# PostgreSQL
POSTGRES_USER=mars
POSTGRES_PASSWORD=mars
POSTGRES_DB=mars_rules
```

### Scaling Considerations

**Stateless Services** (can scale horizontally):
- Ingestion Service — Multiple instances can poll/stream, publish to Kafka
- Dashboard Service — Multiple instances can relay WebSocket, load-balanced via Nginx

**Stateful Services** (requires careful synchronization):
- Processing Service — In-memory state cache would need external cache (Redis) if scaled
- Kafka — Single-broker suitable for development; multi-broker in production
- PostgreSQL — Single instance; use replication in production

---

## Project Documentation

### Key Documents

| Document | Location | Purpose |
|---|---|---|
| **input.md** | [input.md](input.md) | System overview, unified event schema, rule model, user stories |
| **Student_doc.md** | [Student_doc.md](Student_doc.md) | Detailed technical specifications of deployed system |
| **README.md** | [README.md](README.md) | This file — deployment & quick reference |

### Repository Structure

```
<REPO_ROOT>/
├── README.md                      # This file
├── input.md                       # System overview & schema
├── Student_doc.md                 # Deployed system specs
│
├── booklets/
│   ├── description.md             # Project description
│   ├── lofi_mockups/              # Wireframes per user story
│   ├── User_stories/
│   │   ├── relations.md           # Story dependencies
│   │   └── USER_STORIES/          # Detailed story specs
│   └── slides/                    # Presentation slides
│
└── source/
    ├── docker-compose.yml         # Root orchestration
    │
    ├── ingestion-service/         # Sensor collection
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── app/
    │       ├── main.py
    │       ├── config.py
    │       ├── discovery.py
    │       ├── models/
    │       ├── normalizer/
    │       ├── poller/
    │       ├── streamer/
    │       └── kafka_producer.py
    │
    ├── processing-service/        # Rules engine
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── app/
    │       ├── main.py
    │       ├── config.py
    │       ├── state_cache.py
    │       ├── actuator_client.py
    │       ├── database/
    │       ├── models/
    │       ├── rule_engine/
    │       ├── routes/
    │       └── kafka_*.py
    │
    ├── dashboard-service/         # WebSocket relay
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── app/
    │       ├── main.py
    │       ├── config.py
    │       ├── kafka_consumer.py
    │       ├── websocket_manager.py
    │       └── routes/
    │
    └── frontend/                  # React SPA
        ├── Dockerfile
        ├── nginx.conf
        ├── package.json
        ├── vite.config.js
        └── src/
            ├── App.jsx
            ├── components/
            ├── hooks/
            ├── services/
            └── utils/
```

### Documentation Links

- **Architecture Diagram:** See [Architecture](#architecture) section above
- **API Contract:** See [API Documentation](#api-documentation) section above
- **Schema Definition:** See [input.md](input.md) — Unified Event Schema section
- **Rule Model:** See [input.md](input.md) — Automation Rule Model section
- **User Stories Detailed:** See [booklets/User_stories/](booklets/User_stories/)

---

## Development Notes

### Adding a New Sensor

1. **Simulator exposes it** — Check `GET http://localhost:8080/api/sensors` or telemetry topics
2. **Ingestion Service discovers it** — `discovery.py` auto-detects on startup and every 30s
3. **Normalizer maps it** — Add schema family → `UnifiedEvent` mapping in [event_normalizer.py](source/ingestion-service/app/normalizer/event_normalizer.py)
4. **Kafka broadcasts it** — Sensor data automatically flows to `sensor.events`
5. **Dashboard displays it** — New sensor card appears automatically; can filter/search

### Adding a New Automation Rule

1. **Via REST API:**
   ```bash
   curl -X POST http://localhost:8001/api/rules \
     -H 'Content-Type: application/json' \
     -d '{"sensor_name": "...", "metric": "...", "operator": ">", "threshold": 25, ...}'
   ```

2. **Stored in PostgreSQL** — Survives restarts
3. **Evaluated in real-time** — Processing service evaluates on each new sensor event
4. **Actuator triggered** — If condition is true, actuator command is sent to simulator

### Common Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| Dashboard not updating | WebSocket connection lost | Reload page; check browser console |
| Rules not triggering | Kafka lag | Check if sensor events are flowing: `docker compose logs kafka` |
| Database errors | PostgreSQL not ready | Wait for health check: `docker compose ps` |
| Simulator unreachable | Docker network issue | Ensure simulator container is running: `docker compose ps simulator` |
| Out of memory | Kafka retention too long | Reduce `KAFKA_LOG_RETENTION_MS` in docker-compose.yml |

---

## Team & Credits

**Team Members:** 3 postgraduate students, Lab of Advanced Programming, University of [Institution]

**Duration:** 5 days (March 5–10, 2026)

**Technologies:** Python, FastAPI, React, Apache Kafka, PostgreSQL, Docker, Nginx

**Project Goal:** Demonstrate distributed systems architecture, event-driven design, and real-time monitoring in a cloud-native IoT platform.

---

*Last updated: March 10, 2026*  
*For questions, refer to [input.md](input.md) or [Student_doc.md](Student_doc.md)*
