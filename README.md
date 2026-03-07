# Mars Habitat Automation Platform

## Project Overview

A distributed IoT platform for managing telemetry, environmental controls, and automation in a simulated Mars habitat. The system ingests sensor data from a Mars IoT simulator, processes automation rules in real-time, controls actuators, and presents a live monitoring dashboard.

**Architecture:** 3 Python/FastAPI microservices + React SPA, connected via Apache Kafka, backed by PostgreSQL, all orchestrated with Docker Compose.

**Team size:** 3 students

---

## Quick Start

### Prerequisites
- Docker Desktop running
- The simulator OCI image: `mars-iot-simulator-oci.tar`

### 1. Load the simulator image
```bash
docker load -i mars-iot-simulator-oci.tar
```

### 2. Start the entire platform
```bash
cd source
docker compose up -d
```

All 8 services will start with health checks. The dashboard will be available at **http://localhost:3000** once all containers are healthy.

---

## Architecture

```
┌─────────────────┐     REST / SSE      ┌───────────────────┐
│   Mars IoT      │◄────────────────────│  Ingestion        │
│   Simulator     │                     │  Service          │
│   :8080         │   POST actuators    │  (Python/FastAPI) │
│                 │◄──────────────┐     └────────┬──────────┘
└─────────────────┘               │              │ publish
                                  │              ▼
                                  │     ┌────────────────┐
                                  │     │  Apache Kafka   │
                                  │     │  sensor.events  │
                                  │     │  actuator.events│
                                  │     └───┬────────┬───┘
                                  │         │        │
                              consume    consume  consume
                                  │         │        │
                           ┌──────┴─────────┤        │
                           │                │        │
                    ┌──────▼──────┐  ┌──────▼──────┐ │
                    │ Processing  │  │ Dashboard   │ │
                    │ Service     │  │ Service     │◄┘
                    │ :8001       │  │ :8082       │
                    │             │  │             │
                    │ • Rules API │  │ • WS relay  │
                    │ • State     │  │ • API proxy │
                    │ • Actuators │  │             │
                    └──────┬──────┘  └──────┬──────┘
                           │                │
                    ┌──────▼──────┐         │ WebSocket
                    │ PostgreSQL  │         │
                    │ :5432       │  ┌──────▼──────┐
                    │ (rules DB)  │  │  Frontend   │
                    └─────────────┘  │  (React)    │
                                     │  :3000      │
                                     └─────────────┘
```

### Data Flow
1. **Ingestion Service** auto-discovers sensors via `/api/sensors` and `/api/telemetry/topics`, polls REST sensors every 5s, subscribes to SSE telemetry streams
2. All readings are normalized into **UnifiedEvent** format and published to Kafka `sensor.events`
3. **Processing Service** consumes events, updates in-memory state cache, evaluates automation rules, and sends actuator commands to the simulator
4. Actuator state changes are published to Kafka `actuator.events`
5. **Dashboard Service** consumes both Kafka topics and broadcasts to frontend via WebSocket
6. **Frontend** (React SPA served by Nginx) displays real-time data through WebSocket connection and proxies REST API calls through Nginx → Dashboard Service → Processing Service

---

## Service Port Map

| Service | Internal Port | External Port | Purpose |
|---------|--------------|---------------|---------|
| simulator | 8080 | 8080 | Mars IoT Simulator (provided) |
| zookeeper | 2181 | — | Kafka coordination |
| kafka | 9092 | 9092 | Message broker |
| postgres | 5432 | 5432 | Rule persistence database |
| ingestion-service | 8000 | — | Sensor data collection → Kafka |
| processing-service | 8001 | 8001 | Rules engine, state cache, actuator control |
| dashboard-service | 8002 | 8082 | WebSocket relay + API proxy |
| frontend (nginx) | 80 | 3000 | React dashboard UI |

---

## Kafka Topics

| Topic | Producer | Consumers | Payload |
|-------|----------|-----------|---------|
| `sensor.events` | ingestion-service | processing-service, dashboard-service | UnifiedEvent (normalized sensor data) |
| `actuator.events` | processing-service | dashboard-service | Actuator state change triggered by rule |

---

## User Story Coverage

Mapped to user stories defined in `input.md` (15 stories for a 3-person team):

| # | Story | Status | Component |
|---|-------|--------|-----------|
| 1 | See all sensors in an ordered page | ✅ | Dashboard sensor grid |
| 2 | See newest telemetry data | ✅ | WebSocket live updates |
| 3 | See which automation rules are active | ✅ | RuleManager |
| 4 | Override automation rules manually | ✅ | ActuatorPanel toggles |
| 5 | Alert on critical sensor value | ✅ | StatusBadge (ok/warning) |
| 6 | Graphs showing telemetry evolution | ✅ | SensorChart in SensorCard |
| 7 | Monitor greenhouse temp & hydroponic pH | ✅ | Featured sensors section |
| 8 | Auto-update on actuator state change | ✅ | ActuatorPanel WS integration |
| 9 | Know when data was produced | ✅ | Timestamps on all cards |
| 10 | Coherent data with clear units | ✅ | UnifiedEvent schema + normalizer |
| 11 | See connection status to simulator | ✅ | Dashboard connection indicator |
| 12 | Auto-discover new sensors/topics | ✅ | discovery.py — queries simulator at startup + every 30s |
| 13 | Rules survive system restart | ✅ | PostgreSQL persistence |
| 14 | Compare power consumption vs power bus | ✅ | PowerComparison component |
| 15 | Power deficit alert | ✅ | PowerComparison deficit warning |

---

## Baseline Requirements Checklist

Per `project_instructions.md` §7.3:

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| 1 | Event-driven architecture | ✅ | Kafka topics `sensor.events` + `actuator.events` |
| 2 | Meaningful broker usage | ✅ | Decouples ingestion from processing and presentation |
| 3 | Unified event schema | ✅ | UnifiedEvent with Measurement list (documented in input.md) |
| 4 | In-memory latest sensor state | ✅ | StateCache in processing-service |
| 5 | Persistent rule storage | ✅ | PostgreSQL `automation_rules` table |
| 6 | Real-time dashboard | ✅ | React + WebSocket with live updates |
| 7 | Docker reproducibility | ✅ | `docker compose up` starts all 8 services |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend framework | FastAPI | 0.115.6 |
| ASGI server | Uvicorn | 0.34.0 |
| Message broker | Apache Kafka (Confluent) | 7.6.0 |
| Database | PostgreSQL | 16-alpine |
| ORM | SQLAlchemy (async) | 2.0.36 |
| DB driver | asyncpg | 0.30.0 |
| Kafka client | aiokafka | 0.12.0 |
| HTTP client | httpx | 0.28.1 |
| Frontend framework | React | 18.3.1 |
| Build tool | Vite | 5.4.14 |
| CSS | Tailwind CSS | 4.2.1 |
| UI components | Material UI | 5.16.14 |
| Charts | Recharts | 2.13.3 |
| Icons | lucide-react | 0.577.0 |
| Reverse proxy | Nginx | alpine |
| Containerization | Docker Compose | v3.9 |

---

*Last updated: March 7, 2026*
