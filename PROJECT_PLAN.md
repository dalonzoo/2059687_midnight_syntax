# PROJECT PLAN — Mars Habitat Automation Platform

> **Team size:** 3 students | **Target user stories:** ~15  
> **Deadline:** 10 March 2026, 23:59  
> **One-command launch:** `docker compose up`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Repository & Folder Structure](#4-repository--folder-structure)
5. [Unified Event Schema](#5-unified-event-schema)
6. [Service Design](#6-service-design)
   - 6.1 [Ingestion Service](#61-ingestion-service)
   - 6.2 [Processing Service](#62-processing-service)
   - 6.3 [Dashboard Service](#63-dashboard-service)
   - 6.4 [Frontend](#64-frontend)
7. [Kafka Topic Design](#7-kafka-topic-design)
8. [Database Schema — Rule Persistence](#8-database-schema--rule-persistence)
9. [Automation Rule Model](#9-automation-rule-model)
10. [Actuator Integration](#10-actuator-integration)
11. [Docker & Infrastructure](#11-docker--infrastructure)
12. [User Stories](#12-user-stories)
13. [Internal API Contracts](#13-internal-api-contracts)
14. [Frontend Component Tree](#14-frontend-component-tree)
15. [Implementation Milestones](#15-implementation-milestones)
16. [Deliverable Checklist](#16-deliverable-checklist)

---

## 1. Project Overview

A distributed automation platform for a Mars habitat that:

- **Ingests** telemetry from heterogeneous IoT devices (REST polling + SSE/WS streams).
- **Normalizes** all data into a **unified internal event schema**.
- **Transports** events through **Apache Kafka** (event-driven architecture).
- **Evaluates** if-then automation rules in real-time.
- **Controls** actuators based on rule triggers.
- **Persists** automation rules in **PostgreSQL**.
- **Caches** the latest state per sensor **in memory**.
- **Presents** a real-time dashboard via **React** + **WebSocket**.

The simulator is an immutable Docker container (`mars-iot-simulator:multiarch_v1`) providing 8 REST sensors, 7 telemetry stream topics, and 4 actuators.

---

## 2. Architecture

### 2.1 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         MARS HABITAT PLATFORM                        │
│                                                                      │
│  ┌───────────────────┐          ┌────────────────┐                   │
│  │   Mars IoT         │  HTTP    │   Ingestion    │                   │
│  │   Simulator        │◄────────│   Service      │                   │
│  │   (container)      │  poll    │   (FastAPI)    │                   │
│  │                    │─────────►│                │                   │
│  │  ┌──────────────┐  │  SSE/WS  │  - REST Poller │                   │
│  │  │ REST Sensors  │  │─────────►│  - SSE Streamer│                   │
│  │  │ SSE Streams   │  │         │  - Normalizer  │                   │
│  │  │ Actuators     │  │         └───────┬────────┘                   │
│  │  └──────────────┘  │                 │                            │
│  └───────────────────┘                 │ produce                    │
│            ▲                           ▼                            │
│            │               ┌──────────────────────┐                  │
│            │               │     APACHE KAFKA      │                  │
│            │               │                      │                  │
│            │               │  topic: sensor.events │                  │
│            │               │  topic: actuator.cmds │                  │
│            │               └───────┬──────┬───────┘                  │
│            │                       │      │                          │
│            │              consume  │      │ consume                  │
│            │                       ▼      ▼                          │
│            │             ┌──────────┐  ┌──────────────┐              │
│            │  POST       │Processing│  │  Dashboard   │              │
│            │◄────────────│ Service  │  │  Service     │              │
│            │  actuator   │(FastAPI) │  │  (FastAPI)   │              │
│            │             │          │  │              │              │
│            │             │- Rules   │  │- WS Manager  │              │
│            │             │  Engine  │  │- REST Proxy  │              │
│            │             │- State   │  │              │              │
│            │             │  Cache   │  └──────┬───────┘              │
│            │             │- Rule API│         │                      │
│            │             └────┬─────┘    WebSocket                   │
│            │                  │              │                        │
│            │                  ▼              ▼                        │
│            │           ┌───────────┐  ┌───────────────┐              │
│            │           │PostgreSQL │  │   React       │              │
│            │           │(rules DB) │  │   Frontend    │              │
│            │           └───────────┘  │   (Nginx)     │              │
│            │                          └───────────────┘              │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Simulator ──► Ingestion ──► Kafka [sensor.events] ──► Processing ──► Kafka [actuator.events]
                                      │                    │                    │
                                      │                    ▼                    │
                                      │              PostgreSQL                │
                                      │              (rules)                   │
                                      ▼                                        ▼
                                 Dashboard Service ◄───────────────────────────┘
                                      │
                                      │ WebSocket
                                      ▼
                                   React Frontend
```

### 2.3 Separation of Concerns

| Layer            | Service              | Responsibility                                      |
|------------------|----------------------|-----------------------------------------------------|
| **Ingestion**    | `ingestion-service`  | Poll/stream data from simulator, normalize, publish  |
| **Processing**   | `processing-service` | Evaluate rules, trigger actuators, cache state, CRUD |
| **Presentation** | `dashboard-service`  | WebSocket relay, API proxy, serve frontend needs     |
| **Frontend**     | `frontend`           | React SPA served by Nginx                            |

---

## 3. Tech Stack

| Component        | Technology                | Version / Notes                      |
|------------------|---------------------------|--------------------------------------|
| Backend Language | Python 3.12               | All 3 backend services               |
| Backend Framework| FastAPI                   | Async, high-perf, OpenAPI auto-docs  |
| Message Broker   | Apache Kafka              | via `confluentinc/cp-kafka` image    |
| Kafka Mgmt       | Zookeeper (or KRaft)      | Kafka coordination                   |
| Database         | PostgreSQL 16             | Automation rule persistence          |
| ORM / DB client  | SQLAlchemy 2.x + asyncpg  | Async database access                |
| Kafka Client     | `aiokafka`                | Async Kafka producer/consumer        |
| HTTP Client      | `httpx`                   | Async HTTP for polling + actuators   |
| SSE Client       | `aiohttp` / `httpx-sse`   | SSE stream consumption               |
| WebSocket Server | FastAPI WebSocket          | Built-in, no extra dependency        |
| Frontend         | React 18 + Vite           | Fast dev build                       |
| UI Library       | Material UI (MUI) v5      | Professional dashboard components    |
| Charts           | Recharts                  | React-native charting library         |
| Frontend WS      | Native WebSocket API      | No extra library needed              |
| Containerization | Docker + Docker Compose   | One-command deploy                   |
| Reverse Proxy    | Nginx                     | Serves React build + proxies API     |

---

## 4. Repository & Folder Structure

```
<MATRICOLA>_<PROJECT>/
│
├── input.md                         # System overview, user stories, event schema, rule model
├── Student_doc.md                   # Deployed system specifics
├── PROJECT_PLAN.md                  # This file (internal guideline)
│
├── booklets/
│   ├── presentation_slides.pdf      # Final presentation slides
│   ├── architecture_diagram.png     # Exported architecture diagrams
│   ├── lofi_mockups/                # LoFi mockups per user story
│   │   ├── US01_sensor_list.png
│   │   ├── US02_latest_values.png
│   │   └── ...
│   └── user_stories.md              # Detailed user stories spreadsheet
│
├── source/
│   ├── docker-compose.yml           # Root compose file — starts everything
│   │
│   ├── ingestion-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── __init__.py
│   │       ├── main.py              # FastAPI app entry, lifespan startup/shutdown
│   │       ├── config.py            # Env-based configuration (Kafka URL, Simulator URL, etc.)
│   │       ├── models/
│   │       │   ├── __init__.py
│   │       │   └── unified_event.py # Pydantic model of the unified event schema
│   │       ├── normalizer/
│   │       │   ├── __init__.py
│   │       │   └── event_normalizer.py  # Transform each raw schema → unified event
│   │       ├── poller/
│   │       │   ├── __init__.py
│   │       │   └── rest_poller.py   # Periodic REST sensor polling loop
│   │       ├── streamer/
│   │       │   ├── __init__.py
│   │       │   └── telemetry_streamer.py  # SSE/WS telemetry stream consumers
│   │       └── kafka_producer.py    # Async Kafka producer wrapper
│   │
│   ├── processing-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── __init__.py
│   │       ├── main.py              # FastAPI app entry, lifespan
│   │       ├── config.py            # Env-based configuration
│   │       ├── models/
│   │       │   ├── __init__.py
│   │       │   ├── unified_event.py # Same Pydantic model (shared or duplicated)
│   │       │   └── rule.py          # Pydantic model for automation rules
│   │       ├── database/
│   │       │   ├── __init__.py
│   │       │   ├── connection.py    # Async SQLAlchemy engine + session factory
│   │       │   ├── models.py        # SQLAlchemy ORM models (Rule table)
│   │       │   └── rule_repository.py  # CRUD operations for rules
│   │       ├── rule_engine/
│   │       │   ├── __init__.py
│   │       │   └── evaluator.py     # Rule evaluation logic (comparisons)
│   │       ├── state_cache.py       # In-memory dict for latest sensor state
│   │       ├── actuator_client.py   # HTTP client to POST actuator commands to simulator
│   │       ├── kafka_consumer.py    # Async Kafka consumer loop
│   │       ├── kafka_producer.py    # Publish actuator events
│   │       └── routes/
│   │           ├── __init__.py
│   │           ├── rules.py         # CRUD REST endpoints for rules
│   │           ├── state.py         # GET /state — latest sensor values
│   │           └── actuators.py     # GET /actuators — current actuator states
│   │
│   ├── dashboard-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── __init__.py
│   │       ├── main.py              # FastAPI app entry, lifespan
│   │       ├── config.py            # Env-based configuration
│   │       ├── kafka_consumer.py    # Consumes sensor.events + actuator.events
│   │       ├── websocket_manager.py # Manages WebSocket connections, broadcasts
│   │       └── routes/
│   │           ├── __init__.py
│   │           └── proxy.py         # Proxies /api/rules, /api/state, /api/actuators to processing-service
│   │
│   └── frontend/
│       ├── Dockerfile               # Multi-stage: build with Node, serve with Nginx
│       ├── nginx.conf               # Nginx config: serve SPA + proxy /api → dashboard-service
│       ├── package.json
│       ├── vite.config.js
│       ├── index.html
│       └── src/
│           ├── main.jsx             # React entry point
│           ├── App.jsx              # Root component, routing
│           ├── theme.js             # MUI theme customization (Mars-inspired colors)
│           ├── components/
│           │   ├── layout/
│           │   │   ├── Sidebar.jsx       # Navigation sidebar
│           │   │   └── Header.jsx        # Top bar with system status
│           │   ├── dashboard/
│           │   │   ├── Dashboard.jsx     # Main dashboard grid layout
│           │   │   ├── SensorCard.jsx    # Live-value sensor widget
│           │   │   ├── SensorChart.jsx   # Line chart widget (Recharts)
│           │   │   └── StatusBadge.jsx   # ok/warning indicator
│           │   ├── actuators/
│           │   │   ├── ActuatorPanel.jsx # Actuator list + toggle switches
│           │   │   └── ActuatorCard.jsx  # Single actuator state display
│           │   ├── rules/
│           │   │   ├── RuleManager.jsx   # Rule list + CRUD UI
│           │   │   ├── RuleForm.jsx      # Create/edit rule form
│           │   │   └── RuleCard.jsx      # Single rule display
│           │   └── events/
│           │       └── EventLog.jsx      # Real-time event/trigger log
│           ├── hooks/
│           │   ├── useWebSocket.js       # Custom hook for WS connection + reconnect
│           │   └── useSensorData.js      # Hook to manage sensor state from WS
│           ├── services/
│           │   └── api.js               # Axios/fetch wrappers for REST API calls
│           └── utils/
│               └── formatters.js        # Unit formatting, date formatting helpers
```

---

## 5. Unified Event Schema

All heterogeneous sensor data (REST + telemetry) is normalized into this single internal format before being published to Kafka. This is the **core contract** of the platform.

### 5.1 Schema Definition

```json
{
  "event_id": "string (UUID v4)",
  "source_type": "rest | telemetry",
  "sensor_id": "string",
  "schema_family": "string (e.g., rest.scalar.v1, topic.power.v1)",
  "timestamp": "string (ISO 8601 datetime)",
  "measurements": [
    {
      "metric": "string",
      "value": "number",
      "unit": "string"
    }
  ],
  "status": "ok | warning",
  "raw_topic": "string | null (Kafka/SSE topic name, null for REST)",
  "metadata": {}
}
```

### 5.2 Pydantic Model (Python)

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

class Measurement(BaseModel):
    """A single metric reading with its value and unit."""
    metric: str           # e.g., "temperature", "power_kw", "pm25_ug_m3"
    value: float          # numeric value
    unit: str             # e.g., "°C", "kW", "µg/m³"

class UnifiedEvent(BaseModel):
    """
    Unified internal event schema.
    All heterogeneous sensor data is normalized to this format
    before being published to Kafka.
    """
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    source_type: str      # "rest" or "telemetry"
    sensor_id: str        # e.g., "greenhouse_temperature", "solar_array"
    schema_family: str    # e.g., "rest.scalar.v1", "topic.power.v1"
    timestamp: str        # ISO 8601 format
    measurements: List[Measurement]
    status: str           # "ok" or "warning"
    raw_topic: Optional[str] = None   # telemetry topic, null for REST
    metadata: dict = Field(default_factory=dict)
```

### 5.3 Normalization Mapping

Each simulator schema is mapped to the unified format as follows:

| Source Schema | sensor_id | measurements mapping |
|---|---|---|
| `rest.scalar.v1` | `sensor_id` field | Single entry: `[{metric, value, unit}]` |
| `rest.chemistry.v1` | `sensor_id` field | Copy `measurements` array directly |
| `rest.particulate.v1` | `sensor_id` field | 3 entries: `pm1_ug_m3`, `pm25_ug_m3`, `pm10_ug_m3` with unit `µg/m³` |
| `rest.level.v1` | `sensor_id` field | 2 entries: `level_pct` (unit `%`), `level_liters` (unit `L`) |
| `topic.power.v1` | `subsystem` field | 4 entries: `power_kw`, `voltage_v`, `current_a`, `cumulative_kwh` |
| `topic.environment.v1` | `source.system` | Copy `measurements` array directly |
| `topic.thermal_loop.v1` | `loop` field | 2 entries: `temperature_c` (unit `°C`), `flow_l_min` (unit `L/min`) |
| `topic.airlock.v1` | `airlock_id` field | 2 entries: `cycles_per_hour` (unit `cycles/h`), `last_state` (unit `state`) |

---

## 6. Service Design

### 6.1 Ingestion Service

**Purpose:** Collect data from all simulator devices, normalize it, and publish to Kafka.

**Responsibilities:**
- Poll 8 REST sensors every **5 seconds** (configurable via env var `POLL_INTERVAL_SECONDS`)
- Open SSE connections to 7 telemetry topics (long-lived connections with auto-reconnect)
- Normalize every raw payload → `UnifiedEvent` using the mapping table above
- Produce each `UnifiedEvent` as a JSON message to Kafka topic `sensor.events`
- Log all ingestion activity for debugging

**Key Implementation Details:**

```python
# rest_poller.py — Core polling loop (runs as asyncio background task)
async def poll_rest_sensors(producer, config):
    """
    Periodically polls all REST sensors and publishes normalized events.
    Runs in the FastAPI lifespan as a background task.
    """
    sensors = [
        ("greenhouse_temperature", "rest.scalar.v1"),
        ("entrance_humidity", "rest.scalar.v1"),
        ("co2_hall", "rest.scalar.v1"),
        ("corridor_pressure", "rest.scalar.v1"),
        ("hydroponic_ph", "rest.chemistry.v1"),
        ("water_tank_level", "rest.level.v1"),
        ("air_quality_pm25", "rest.particulate.v1"),
        ("air_quality_voc", "rest.chemistry.v1"),
    ]
    async with httpx.AsyncClient() as client:
        while True:
            for sensor_id, schema_family in sensors:
                response = await client.get(f"{config.SIMULATOR_URL}/api/sensors/{sensor_id}")
                raw = response.json()
                event = normalize(raw, schema_family, source_type="rest")
                await producer.send("sensor.events", event.model_dump_json())
            await asyncio.sleep(config.POLL_INTERVAL_SECONDS)
```

```python
# telemetry_streamer.py — SSE stream consumer (one task per topic)
async def stream_telemetry_topic(topic, schema_family, producer, config):
    """
    Connects to an SSE stream for a single telemetry topic.
    Automatically reconnects on disconnection.
    """
    url = f"{config.SIMULATOR_URL}/api/telemetry/stream/{topic}"
    while True:
        try:
            async with httpx_sse.aconnect_sse(client, "GET", url) as event_source:
                async for sse in event_source.aiter_sse():
                    raw = json.loads(sse.data)
                    event = normalize(raw, schema_family, source_type="telemetry", raw_topic=topic)
                    await producer.send("sensor.events", event.model_dump_json())
        except Exception as e:
            logger.error(f"SSE stream {topic} disconnected: {e}, reconnecting...")
            await asyncio.sleep(2)
```

**Environment Variables:**

| Variable | Default | Description |
|---|---|---|
| `SIMULATOR_URL` | `http://simulator:8080` | Base URL of the Mars IoT simulator |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka broker address |
| `POLL_INTERVAL_SECONDS` | `5` | REST sensor polling interval |

---

### 6.2 Processing Service

**Purpose:** Consume normalized events, evaluate automation rules, manage state cache, and trigger actuators.

**Responsibilities:**
- Consume from Kafka topic `sensor.events`
- Update in-memory latest state cache per sensor
- Load rules from PostgreSQL on startup; reload dynamically on CRUD operations
- Evaluate all matching rules against each incoming event
- POST actuator commands to the simulator when a rule fires
- Publish actuator state changes to Kafka topic `actuator.events`
- Expose REST API for rules CRUD, latest state, and actuator states

**Key Implementation Details:**

```python
# state_cache.py — Thread-safe in-memory sensor state
class StateCache:
    """
    In-memory cache of the latest reading per sensor.
    Keys are sensor_id strings, values are UnifiedEvent dicts.
    """
    def __init__(self):
        self._cache: dict[str, dict] = {}
        self._lock = asyncio.Lock()

    async def update(self, sensor_id: str, event: dict):
        async with self._lock:
            self._cache[sensor_id] = event

    async def get_all(self) -> dict:
        async with self._lock:
            return dict(self._cache)

    async def get(self, sensor_id: str) -> dict | None:
        async with self._lock:
            return self._cache.get(sensor_id)
```

```python
# evaluator.py — Rule evaluation engine
def evaluate_rule(rule, event: dict) -> bool:
    """
    Evaluate a single automation rule against an event.
    Rule format: IF <sensor_name> <op> <threshold> THEN set <actuator> to ON|OFF
    Returns True if the rule condition is satisfied.
    """
    if rule.sensor_name != event["sensor_id"]:
        return False

    # Find the matching measurement in the event
    for m in event["measurements"]:
        if m["metric"] == rule.metric:
            return compare(m["value"], rule.operator, rule.threshold)
    return False

def compare(value: float, operator: str, threshold: float) -> bool:
    ops = {
        "<": lambda a, b: a < b,
        "<=": lambda a, b: a <= b,
        "=": lambda a, b: a == b,
        ">": lambda a, b: a > b,
        ">=": lambda a, b: a >= b,
    }
    return ops[operator](value, threshold)
```

**REST API Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/rules` | List all automation rules |
| `POST` | `/api/rules` | Create a new rule |
| `GET` | `/api/rules/{id}` | Get single rule |
| `PUT` | `/api/rules/{id}` | Update a rule |
| `DELETE` | `/api/rules/{id}` | Delete a rule |
| `GET` | `/api/state` | Get latest state of all sensors |
| `GET` | `/api/state/{sensor_id}` | Get latest state of one sensor |
| `GET` | `/api/actuators` | Get current actuator states (proxied from simulator) |
| `POST` | `/api/actuators/{name}` | Manually set actuator state |

**Environment Variables:**

| Variable | Default | Description |
|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka broker address |
| `DATABASE_URL` | `postgresql+asyncpg://mars:mars@postgres:5432/mars_rules` | PostgreSQL connection |
| `SIMULATOR_URL` | `http://simulator:8080` | For actuator POST calls |

---

### 6.3 Dashboard Service

**Purpose:** Bridge between Kafka and the frontend — relay real-time events via WebSocket and proxy REST API calls.

**Responsibilities:**
- Consume from Kafka topics `sensor.events` and `actuator.events`
- Manage WebSocket connections from multiple frontend clients
- Broadcast incoming events to all connected WebSocket clients in real-time
- Proxy REST calls (rules, state, actuators) to processing-service
- Provide a health endpoint

**Key Implementation Details:**

```python
# websocket_manager.py — WebSocket connection manager
class WebSocketManager:
    """Manages all active WebSocket connections and broadcasts events."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active_connections.remove(ws)

    async def broadcast(self, message: dict):
        """Send a JSON message to all connected clients."""
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except WebSocketDisconnect:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)
```

**WebSocket Message Format:**

```json
{
  "type": "sensor_update | actuator_update | rule_triggered",
  "data": { ... }
}
```

**Environment Variables:**

| Variable | Default | Description |
|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka broker address |
| `PROCESSING_SERVICE_URL` | `http://processing-service:8001` | URL for API proxy |

---

### 6.4 Frontend

**Purpose:** React SPA providing a real-time Mars habitat monitoring dashboard.

**Key Features:**
- **Dashboard view:** Grid of sensor cards with live values, status badges, and mini charts
- **Sensor detail:** Line chart of historical values (accumulated while page is open)
- **Actuator panel:** View states + manual toggle switches
- **Rule manager:** Full CRUD interface for automation rules
- **Event log:** Real-time feed of rule triggers and actuator changes

**Routing:**

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Dashboard | Main sensor overview grid |
| `/actuators` | ActuatorPanel | Actuator state + controls |
| `/rules` | RuleManager | Rule list + create/edit |
| `/events` | EventLog | Real-time event log |

**WebSocket Connection:**
- Connects to `ws://<dashboard-service>/ws`
- Receives `sensor_update`, `actuator_update`, `rule_triggered` messages
- Updates React state via `useSensorData` hook

**Build & Serve:**
- `npm run build` via Vite → static files
- Nginx serves `dist/` and proxies `/api/*` → `dashboard-service:8002`
- Nginx proxies `/ws` → `dashboard-service:8002/ws`

---

## 7. Kafka Topic Design

| Topic | Producer | Consumer(s) | Key | Value |
|-------|----------|-------------|-----|-------|
| `sensor.events` | ingestion-service | processing-service, dashboard-service | `sensor_id` | `UnifiedEvent` JSON |
| `actuator.events` | processing-service | dashboard-service | `actuator_name` | Actuator event JSON |

**Partitioning Strategy:**
- `sensor.events`: Keyed by `sensor_id` → ensures all events for one sensor go to the same partition (ordering guarantee)
- `actuator.events`: Keyed by `actuator_name`

**Retention:** 1 hour (short-term, since we don't persist history)

**Consumer Groups:**
- `processing-group` — processing-service
- `dashboard-group` — dashboard-service

---

## 8. Database Schema — Rule Persistence

### PostgreSQL Table: `automation_rules`

```sql
CREATE TABLE IF NOT EXISTS automation_rules (
    id            SERIAL PRIMARY KEY,
    sensor_name   VARCHAR(100) NOT NULL,          -- e.g., "greenhouse_temperature"
    metric        VARCHAR(100) NOT NULL,          -- e.g., "temperature" (measurement metric name)
    operator      VARCHAR(2)   NOT NULL,          -- <, <=, =, >, >=
    threshold     DOUBLE PRECISION NOT NULL,      -- e.g., 28.0
    unit          VARCHAR(50),                    -- e.g., "°C" (informational)
    actuator_name VARCHAR(100) NOT NULL,          -- e.g., "cooling_fan"
    actuator_state VARCHAR(3)  NOT NULL,          -- "ON" or "OFF"
    enabled       BOOLEAN DEFAULT TRUE,           -- allow disabling without deleting
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_rules_sensor ON automation_rules(sensor_name);
CREATE INDEX idx_rules_enabled ON automation_rules(enabled);
```

### SQLAlchemy ORM Model

```python
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime

class Base(DeclarativeBase):
    pass

class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sensor_name = Column(String(100), nullable=False, index=True)
    metric = Column(String(100), nullable=False)
    operator = Column(String(2), nullable=False)
    threshold = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    actuator_name = Column(String(100), nullable=False)
    actuator_state = Column(String(3), nullable=False)  # ON or OFF
    enabled = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

## 9. Automation Rule Model

### 9.1 Rule Format

```
IF <sensor_name>.<metric> <operator> <value> [unit]
THEN set <actuator_name> to ON | OFF
```

**Supported operators:** `<`, `<=`, `=`, `>`, `>=`

### 9.2 Example Rules

| # | Rule | Description |
|---|------|-------------|
| 1 | IF `greenhouse_temperature`.`temperature` > 28 °C THEN set `cooling_fan` to ON | Activate cooling when greenhouse is too hot |
| 2 | IF `greenhouse_temperature`.`temperature` <= 20 °C THEN set `habitat_heater` to ON | Activate heating when too cold |
| 3 | IF `entrance_humidity`.`humidity` < 30 % THEN set `entrance_humidifier` to ON | Activate humidifier when air is too dry |
| 4 | IF `co2_hall`.`co2` > 1000 ppm THEN set `hall_ventilation` to ON | Activate ventilation on high CO₂ |

### 9.3 Evaluation Flow

1. Event arrives at processing-service from Kafka
2. Look up all **enabled** rules where `rule.sensor_name == event.sensor_id`
3. For each matching rule, find the measurement with `metric == rule.metric`
4. Apply the comparison operator: `measurement.value <op> rule.threshold`
5. If condition is true → POST to simulator actuator endpoint → publish to `actuator.events`

### 9.4 Rule API Request/Response

**Create Rule Request:**
```json
{
  "sensor_name": "greenhouse_temperature",
  "metric": "temperature",
  "operator": ">",
  "threshold": 28.0,
  "unit": "°C",
  "actuator_name": "cooling_fan",
  "actuator_state": "ON"
}
```

**Rule Response:**
```json
{
  "id": 1,
  "sensor_name": "greenhouse_temperature",
  "metric": "temperature",
  "operator": ">",
  "threshold": 28.0,
  "unit": "°C",
  "actuator_name": "cooling_fan",
  "actuator_state": "ON",
  "enabled": true,
  "created_at": "2026-03-06T12:00:00Z",
  "updated_at": "2026-03-06T12:00:00Z"
}
```

---

## 10. Actuator Integration

The simulator exposes 4 actuators at `POST /api/actuators/{name}`:

| Actuator | Controlled By |
|---|---|
| `cooling_fan` | Temperature rules |
| `entrance_humidifier` | Humidity rules |
| `hall_ventilation` | CO₂ / air quality rules |
| `habitat_heater` | Temperature rules |

**Client implementation:**

```python
# actuator_client.py
async def set_actuator_state(actuator_name: str, state: str, config) -> dict:
    """
    Send a POST request to the simulator to change actuator state.
    Returns the actuator response.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{config.SIMULATOR_URL}/api/actuators/{actuator_name}",
            json={"state": state},
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
```

---

## 11. Docker & Infrastructure

### 11.1 docker-compose.yml

```yaml
version: "3.9"

services:
  # ---- Provided simulator (DO NOT MODIFY) ----
  simulator:
    image: mars-iot-simulator:multiarch_v1
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ---- Infrastructure ----
  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
      interval: 10s
      timeout: 10s
      retries: 10

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: mars
      POSTGRES_PASSWORD: mars
      POSTGRES_DB: mars_rules
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mars"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ---- Application Services ----
  ingestion-service:
    build: ./ingestion-service
    depends_on:
      simulator:
        condition: service_healthy
      kafka:
        condition: service_healthy
    environment:
      SIMULATOR_URL: http://simulator:8080
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      POLL_INTERVAL_SECONDS: "5"
    restart: unless-stopped

  processing-service:
    build: ./processing-service
    depends_on:
      kafka:
        condition: service_healthy
      postgres:
        condition: service_healthy
      simulator:
        condition: service_healthy
    ports:
      - "8001:8001"
    environment:
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      DATABASE_URL: postgresql+asyncpg://mars:mars@postgres:5432/mars_rules
      SIMULATOR_URL: http://simulator:8080
    restart: unless-stopped

  dashboard-service:
    build: ./dashboard-service
    depends_on:
      kafka:
        condition: service_healthy
      processing-service:
        condition: service_started
    ports:
      - "8002:8002"
    environment:
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      PROCESSING_SERVICE_URL: http://processing-service:8001
    restart: unless-stopped

  frontend:
    build: ./frontend
    depends_on:
      - dashboard-service
    ports:
      - "3000:80"
    restart: unless-stopped

volumes:
  pgdata:
```

### 11.2 Service Dockerfiles

**Python services (template):**
```dockerfile
FROM python:3.12-slim

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Run the service
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

> **Note:** Change port per service: ingestion=8000, processing=8001, dashboard=8002.

**Frontend Dockerfile (multi-stage):**
```dockerfile
# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 11.3 Nginx Configuration (frontend)

```nginx
server {
    listen 80;
    server_name localhost;

    # Serve React SPA
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to dashboard-service
    location /api/ {
        proxy_pass http://dashboard-service:8002/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy WebSocket to dashboard-service
    location /ws {
        proxy_pass http://dashboard-service:8002/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### 11.4 Service Ports Summary

| Service | Internal Port | External Port | Purpose |
|---|---|---|---|
| simulator | 8080 | 8080 | IoT simulator |
| kafka | 9092 | 9092 | Message broker |
| postgres | 5432 | 5432 | Rule database |
| ingestion-service | 8000 | — | No external access needed |
| processing-service | 8001 | 8001 | Rules API (direct debug access) |
| dashboard-service | 8002 | 8002 | API + WS relay |
| frontend (nginx) | 80 | 3000 | Dashboard UI |

---

## 12. User Stories

> **Target:** ~15 user stories for a team of 3.

### Sensor Monitoring

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-01 | As an operator, I want to see a list of all sensors so that I know what is being monitored. | Must | Dashboard shows all 15 sensors (8 REST + 7 telemetry) with their names and types. |
| US-02 | As an operator, I want to see the latest value of each sensor so that I can monitor habitat conditions. | Must | Each sensor card displays the most recent reading with value and unit. |
| US-03 | As an operator, I want sensor values to update in real-time (without refresh) so that I have live awareness. | Must | Values update within 6 seconds of new data via WebSocket. |
| US-04 | As an operator, I want to see the status (ok/warning) of each sensor to quickly identify anomalies. | Must | Status badge (green/yellow) shown on each sensor card. |
| US-05 | As an operator, I want to see a time-series chart of a sensor's recent values (while page is open) so that I can spot trends. | Should | Recharts line chart accumulates data points while dashboard is open. |

### Actuator Control

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-06 | As an operator, I want to see the current state of all actuators so that I know what is ON or OFF. | Must | Actuator panel lists 4 actuators with current state. |
| US-07 | As an operator, I want to manually toggle an actuator so that I can override automation. | Must | Toggle switch sends POST and updates state on success. |

### Automation Rules

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-08 | As an operator, I want to create an automation rule so that actuators respond to sensor conditions. | Must | Form with sensor, metric, operator, threshold, actuator, state. Saved to DB. |
| US-09 | As an operator, I want to view all configured rules so that I can review automation. | Must | List view showing all rules with their conditions and actions. |
| US-10 | As an operator, I want to edit an existing rule so I can adjust thresholds. | Must | Edit form pre-filled with current values. |
| US-11 | As an operator, I want to delete a rule so I can remove outdated automation. | Must | Delete button with confirmation. Rule removed from DB. |
| US-12 | As an operator, I want rules to persist across system restarts so I don't lose configuration. | Must | After `docker compose down` and `up`, rules still exist. |
| US-13 | As an operator, I want to enable/disable a rule without deleting it. | Should | Toggle switch on rule card; disabled rules are skipped during evaluation. |

### System & Events

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-14 | As an operator, I want to see a live log when rules are triggered so I have an audit trail. | Should | Event log panel shows actuator changes with timestamp, rule ID, and new state. |
| US-15 | As an operator, I want the entire system to start with one command so that deployment is simple. | Must | `docker compose up` starts all services; dashboard is accessible at `http://localhost:3000`. |

---

## 13. Internal API Contracts

### 13.1 Processing Service API

#### Rules CRUD

```
GET    /api/rules                → 200 [Rule]
POST   /api/rules                → 201 Rule
GET    /api/rules/{id}           → 200 Rule | 404
PUT    /api/rules/{id}           → 200 Rule | 404
DELETE /api/rules/{id}           → 204 | 404
```

#### Sensor State

```
GET    /api/state                → 200 { "sensors": { "<sensor_id>": UnifiedEvent, ... } }
GET    /api/state/{sensor_id}    → 200 UnifiedEvent | 404
```

#### Actuators (Proxy to simulator)

```
GET    /api/actuators            → 200 { "actuators": { "<name>": "ON"|"OFF", ... } }
POST   /api/actuators/{name}     → 200 { "actuator": "...", "state": "...", "updated_at": "..." }
```

### 13.2 Dashboard Service API

```
# Proxy endpoints — forwards to processing-service
GET    /api/rules                → proxy → processing-service
POST   /api/rules                → proxy → processing-service
PUT    /api/rules/{id}           → proxy → processing-service
DELETE /api/rules/{id}           → proxy → processing-service
GET    /api/state                → proxy → processing-service
GET    /api/state/{sensor_id}    → proxy → processing-service
GET    /api/actuators            → proxy → processing-service
POST   /api/actuators/{name}     → proxy → processing-service

# WebSocket
WS     /ws                      → real-time event stream to frontend
```

### 13.3 WebSocket Message Types

```json
// Sensor update (from sensor.events Kafka topic)
{
  "type": "sensor_update",
  "data": { /* UnifiedEvent */ }
}

// Actuator state change (from actuator.events Kafka topic)
{
  "type": "actuator_update",
  "data": {
    "actuator_name": "cooling_fan",
    "state": "ON",
    "triggered_by_rule": 1,
    "timestamp": "2026-03-06T12:00:00Z"
  }
}
```

---

## 14. Frontend Component Tree

```
App
├── Header (system title, connection status indicator)
├── Sidebar (navigation links)
└── Routes
    ├── "/" → Dashboard
    │         ├── SensorCard × N (live value, unit, status badge)
    │         │   └── StatusBadge (ok=green, warning=amber)
    │         └── SensorChart (Recharts LineChart, data appended via WS)
    ├── "/actuators" → ActuatorPanel
    │                   └── ActuatorCard × 4 (name, state, toggle switch)
    ├── "/rules" → RuleManager
    │               ├── RuleCard × N (sentence view + edit/delete buttons)
    │               └── RuleForm (modal or inline, create/edit)
    └── "/events" → EventLog
                     └── EventRow × N (timestamp, rule, actuator, new state)
```

**Key React Hooks:**

```javascript
// useWebSocket.js — manages persistent WebSocket connection
function useWebSocket(url) {
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  // ... auto-reconnect logic with exponential backoff
  return { lastMessage, isConnected };
}

// useSensorData.js — maintains sensor state from WS messages
function useSensorData() {
  const { lastMessage } = useWebSocket("/ws");
  const [sensors, setSensors] = useState({});
  const [history, setHistory] = useState({});  // for charts

  useEffect(() => {
    if (lastMessage?.type === "sensor_update") {
      const event = lastMessage.data;
      setSensors(prev => ({ ...prev, [event.sensor_id]: event }));
      // Append to history for charting (keep last 100 points)
      setHistory(prev => ({
        ...prev,
        [event.sensor_id]: [...(prev[event.sensor_id] || []).slice(-99), event]
      }));
    }
  }, [lastMessage]);

  return { sensors, history };
}
```

---

## 15. Implementation Milestones

### Day 1 — Foundation (March 6)
- [x] Read project instructions + schema contracts
- [x] Define tech stack and architecture
- [x] Write this project plan
- [ ] Set up Git repository with correct folder structure
- [ ] Draft `input.md` with user stories and event schema
- [ ] Create base `docker-compose.yml` with infrastructure (Kafka, Postgres, simulator)
- [ ] Verify simulator runs and responds to API calls

### Day 2 — Ingestion + Processing Core (March 7)
- [ ] Implement `UnifiedEvent` Pydantic model (shared across services)
- [ ] Implement normalizer for all 5 REST schemas
- [ ] Implement REST poller (polling loop + Kafka producer)
- [ ] Implement normalizer for all 4 telemetry schemas
- [ ] Implement SSE telemetry streamer
- [ ] Implement processing-service Kafka consumer
- [ ] Implement in-memory state cache
- [ ] Implement PostgreSQL rule table + SQLAlchemy model
- [ ] Implement rules CRUD API
- [ ] Dockerize ingestion-service and processing-service
- [ ] Verify end-to-end: simulator → ingestion → Kafka → processing → state cache

### Day 3 — Rule Engine + Dashboard Backend (March 8)
- [ ] Implement rule evaluation engine
- [ ] Implement actuator client (POST to simulator)
- [ ] Implement actuator event publishing to Kafka
- [ ] Implement dashboard-service: Kafka consumer + WebSocket manager
- [ ] Implement dashboard-service: API proxy routes
- [ ] Dockerize dashboard-service
- [ ] Verify: rule trigger → actuator command → actuator.events → WebSocket

### Day 4 — Frontend + Integration (March 9)
- [ ] Scaffold React app with Vite + MUI
- [ ] Implement Dashboard page (SensorCard grid + live updates)
- [ ] Implement SensorChart component (Recharts)
- [ ] Implement ActuatorPanel (state display + toggle)
- [ ] Implement RuleManager (CRUD UI)
- [ ] Implement EventLog (real-time rule triggers)
- [ ] Dockerize frontend (multi-stage Nginx build)
- [ ] Full `docker compose up` end-to-end test
- [ ] Fix integration issues

### Day 5 — Polish + Documentation (March 10)
- [ ] Finalize `input.md` (system overview, user stories, LoFi mockups, event schema, rule model)
- [ ] Write `Student_doc.md` (deployed system specifics)
- [ ] Create architecture diagrams (export as PNG)
- [ ] Create LoFi mockups for each user story
- [ ] Prepare presentation slides
- [ ] Final `docker compose down && docker compose up` clean test
- [ ] Push to GitHub

---

## 16. Deliverable Checklist

| # | Deliverable | File/Location | Status |
|---|---|---|---|
| 1 | `input.md` | `./input.md` | ☐ |
| 2 | `Student_doc.md` | `./Student_doc.md` | ☐ |
| 3 | Source code | `./source/` | ☐ |
| 4 | `docker-compose.yml` | `./source/docker-compose.yml` | ☐ |
| 5 | Dockerfile (ingestion) | `./source/ingestion-service/Dockerfile` | ☐ |
| 6 | Dockerfile (processing) | `./source/processing-service/Dockerfile` | ☐ |
| 7 | Dockerfile (dashboard) | `./source/dashboard-service/Dockerfile` | ☐ |
| 8 | Dockerfile (frontend) | `./source/frontend/Dockerfile` | ☐ |
| 9 | Architecture diagrams | `./booklets/` | ☐ |
| 10 | LoFi mockups | `./booklets/lofi_mockups/` | ☐ |
| 11 | Presentation slides | `./booklets/` | ☐ |
| 12 | User stories | `./input.md` (section) | ☐ |

### Compliance Matrix

| Requirement | Section | How We Comply |
|---|---|---|
| Event-driven architecture | §6 | All data flows through Kafka topics |
| Meaningful broker usage | §7 | 2 topics, keyed partitions, 2 consumer groups |
| Unified event schema | §5 | `UnifiedEvent` Pydantic model, documented in `input.md` |
| In-memory latest sensor state | §6.2 | `StateCache` dict in processing-service |
| Persistent rule storage | §8 | PostgreSQL `automation_rules` table with SQLAlchemy ORM |
| Real-time dashboard | §6.4 | React + WebSocket + live Recharts |
| Docker reproducibility | §11 | 4 Dockerfiles + 1 docker-compose.yml, `docker compose up` |
| Multiple backend services | §6 | 3 services: ingestion, processing, dashboard |
| Separate ingestion/processing/presentation | §2.3 | Explicit layer separation |
| ~15 user stories | §12 | 15 user stories documented |
| REST polling | §6.1 | 8 sensors polled every 5s |
| Telemetry streams | §6.1 | 7 SSE streams consumed |
| Rule persistence across restarts | §8 | PostgreSQL with Docker volume |
| Actuator control | §10 | POST to simulator via `actuator_client.py` |

---

## Appendix A — Key Python Dependencies

### ingestion-service/requirements.txt
```
fastapi==0.115.*
uvicorn[standard]==0.34.*
aiokafka==0.12.*
httpx==0.28.*
httpx-sse==0.4.*
pydantic==2.*
```

### processing-service/requirements.txt
```
fastapi==0.115.*
uvicorn[standard]==0.34.*
aiokafka==0.12.*
httpx==0.28.*
pydantic==2.*
sqlalchemy[asyncio]==2.*
asyncpg==0.30.*
```

### dashboard-service/requirements.txt
```
fastapi==0.115.*
uvicorn[standard]==0.34.*
aiokafka==0.12.*
httpx==0.28.*
pydantic==2.*
```

## Appendix B — Frontend Dependencies (package.json excerpt)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.28.0",
    "@mui/material": "^5.16.0",
    "@mui/icons-material": "^5.16.0",
    "@emotion/react": "^11.13.0",
    "@emotion/styled": "^11.13.0",
    "recharts": "^2.13.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

## Appendix C — Code Commenting Guidelines

All code should follow these commenting practices:

1. **Module-level docstring** in every Python file explaining its purpose
2. **Class docstrings** explaining the class responsibility
3. **Function docstrings** explaining parameters, return values, and behavior
4. **Inline comments** for non-obvious logic (e.g., normalization mappings, rule evaluation flow)
5. **React components**: JSDoc comments above each component describing its props and behavior
6. **Configuration files**: Comments explaining each env var and its impact

Example:
```python
"""
rest_poller.py — Periodic REST Sensor Polling

This module implements the background polling loop that periodically
queries all REST-based sensors on the Mars IoT simulator and publishes
normalized events to Kafka.
"""
```

---

*This plan is the single source of truth for the project. All implementation decisions should reference this document.*
