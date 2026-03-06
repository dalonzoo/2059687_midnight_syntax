# Mars Habitat Automation Platform

## Project Overview

A distributed IoT platform for managing telemetry, environmental controls, and automation in a simulated Mars Habitat. The system ingests sensor data from a Mars IoT simulator, processes automation rules in real-time, controls actuators, and presents a live monitoring dashboard.

**Architecture:** 3 Python microservices + React SPA, connected via Apache Kafka, backed by PostgreSQL, all orchestrated with Docker Compose.

---

## Quick Start

### Prerequisites
- Docker Desktop running
- The simulator OCI image: `mars-iot-simulator-oci.tar`

### 1. Load the simulator image
```bash
docker load -i mars-iot-simulator-oci.tar
```

### 2. Start all services (backend only — skip frontend during dev)
```bash
cd source
docker compose up -d zookeeper kafka postgres simulator ingestion-service processing-service dashboard-service
```

### 3. Start everything including frontend
```bash
cd source
docker compose up -d
```

Dashboard UI will be accessible at **http://localhost:3000**

---

## Service Port Map

| Service | Internal Port | External Port | Purpose |
|---------|--------------|---------------|---------|
| simulator | 8080 | 8080 | Mars IoT Simulator |
| kafka | 9092 | 9092 | Message broker |
| postgres | 5432 | 5432 | Rule database |
| ingestion-service | 8000 | — | No external access needed |
| processing-service | 8001 | **8001** | Rules API (direct access for testing) |
| dashboard-service | 8002 | **8082** | API proxy + WebSocket relay |
| frontend (nginx) | 80 | **3000** | React dashboard UI |

> **Note:** `dashboard-service` is mapped to host port **8082** (port 8002 is reserved by Docker Desktop on some installations).

---

## Backend Testing Guide

All tests can be run with standard `curl` commands or PowerShell's `Invoke-RestMethod`. Run these after `docker compose up` to verify the full pipeline is working.

### Step 1 — Verify simulator is up

```bash
curl http://localhost:8080/health
# Expected: {"status":"ok"}

curl http://localhost:8080/api/sensors | python3 -m json.tool
# Expected: list of 8 REST sensor IDs

curl http://localhost:8080/api/actuators | python3 -m json.tool
# Expected: {"cooling_fan":"OFF", "entrance_humidifier":"OFF", ...}
```

### Step 2 — Verify service health endpoints

```bash
curl http://localhost:8001/health
# Expected: {"status":"ok","service":"processing-service"}

curl http://localhost:8082/health
# Expected: {"status":"ok","service":"dashboard-service","ws_connections":0}
```

### Step 3 — Verify sensor data is flowing through Kafka

Wait ~10 seconds after startup for the ingestion service to poll all sensors and publish to Kafka.

```bash
curl http://localhost:8001/api/state | python3 -m json.tool
# Expected: {"sensors": {"greenhouse_temperature": {...}, "co2_hall": {...}, ...}}
# Should contain ~8 sensor entries with live values and timestamps
```

Check a single sensor:
```bash
curl http://localhost:8001/api/state/greenhouse_temperature | python3 -m json.tool
# Expected: full UnifiedEvent JSON with sensor_id, measurements (temperature_c in °C), timestamp
```

### Step 4 — Verify API proxy through dashboard-service

```bash
curl http://localhost:8082/api/state | python3 -m json.tool
# Expected: same response as above, proxied through dashboard-service
```

### Step 5 — Test automation rule CRUD

Create a rule (cool if greenhouse > 20°C):
```bash
curl -X POST http://localhost:8001/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_name": "greenhouse_temperature",
    "metric": "temperature_c",
    "operator": ">",
    "threshold": 20,
    "unit": "C",
    "actuator_name": "cooling_fan",
    "actuator_state": "ON"
  }'
# Expected: rule object with "id": 1, "enabled": true
```

List rules:
```bash
curl http://localhost:8001/api/rules | python3 -m json.tool
# Expected: list containing the rule just created
```

Update a rule:
```bash
curl -X PUT http://localhost:8001/api/rules/1 \
  -H "Content-Type: application/json" \
  -d '{"threshold": 25}'
# Expected: updated rule object with threshold 25.0
```

Delete a rule:
```bash
curl -X DELETE http://localhost:8001/api/rules/1
# Expected: HTTP 204 No Content
```

Recreate it for the next test:
```bash
curl -X POST http://localhost:8001/api/rules \
  -H "Content-Type: application/json" \
  -d '{"sensor_name":"greenhouse_temperature","metric":"temperature_c","operator":">","threshold":20,"unit":"C","actuator_name":"cooling_fan","actuator_state":"ON"}'
```

### Step 6 — Verify end-to-end rule trigger → actuator

After creating the rule above (threshold 20°C, greenhouse is typically ~22–26°C), wait ~10 seconds for the next Kafka message cycle:

```bash
curl http://localhost:8080/api/actuators | python3 -m json.tool
# Expected: "cooling_fan": "ON"  ← rule fired and commanded the simulator
```

Verify the rule also reaches the simulator via processing-service proxy:
```bash
curl http://localhost:8001/api/actuators | python3 -m json.tool
# Expected: {"actuators": {"cooling_fan": "ON", ...}}
```

### Step 7 — Test rule persistence across restart

```bash
# Stop and restart the processing service
docker compose restart processing-service
# Wait ~5 seconds
curl http://localhost:8001/api/rules | python3 -m json.tool
# Expected: rules are still there (persisted in PostgreSQL)
```

### Step 8 — Test WebSocket stream (dashboard-service)

Using `wscat` (Node.js tool) or a browser console:

```bash
# Install wscat if needed: npm install -g wscat
wscat -c ws://localhost:8082/ws
# Expected: JSON messages arriving every ~5s:
# {"type":"sensor_update","data":{"sensor_id":"greenhouse_temperature",...}}
```

Or from a browser console (open http://localhost:8080 or any page):
```javascript
const ws = new WebSocket('ws://localhost:8082/ws');
ws.onmessage = e => console.log(JSON.parse(e.data));
// Observe sensor_update messages streaming in
```

---

## Current Build Status

### Backend — ✅ `COMPLETE` (Integration tested)

All three Python/FastAPI microservices are fully implemented and verified running end-to-end.

#### `ingestion-service` — ✅ Running
| Component | Status | Notes |
|-----------|--------|-------|
| REST Poller (8 sensors) | ✅ | Polls all 8 REST sensors every 5s via `httpx` |
| SSE Streamer (7 topics) | ✅ | One `asyncio` task per topic, auto-reconnect on failure |
| Event Normalizer (8 schemas) | ✅ | All 8 schema families mapped to unified format |
| Kafka Producer | ✅ | Async `send_and_wait`, keyed by `sensor_id` |

#### `processing-service` — ✅ Running
| Component | Status | Notes |
|-----------|--------|-------|
| Kafka Consumer | ✅ | Consumes `sensor.events`, publishes `actuator.events` |
| State Cache | ✅ | Thread-safe in-memory dict, verified populated with live data |
| Rule Engine | ✅ | 5 operators, sensor+metric matching — verified triggering actuator |
| Actuator Client | ✅ | POST/GET to simulator — verified `cooling_fan` toggled ON by rule |
| Rules CRUD API | ✅ | Full REST — verified create, read, update, delete |
| PostgreSQL ORM | ✅ | Rules persist across service restarts |

#### `dashboard-service` — ✅ Running
| Component | Status | Notes |
|-----------|--------|-------|
| Kafka Consumer | ✅ | Subscribed to `sensor.events` + `actuator.events` |
| WebSocket Manager | ✅ | Broadcasting to connected clients |
| REST API Proxy | ✅ | All endpoints proxied to processing-service |

### Frontend — ⚠️ `~90% COMPLETE`

React 18 + Vite + Material UI. All 24 source files contain real implementation (no stubs). Frontend Dockerfile builds successfully.

#### ✅ Fully Implemented
| Component | Status |
|-----------|--------|
| React Router (4 routes: `/`, `/actuators`, `/rules`, `/events`) | ✅ |
| MUI Dark Theme (Mars palette: rust-orange + amber) | ✅ |
| WebSocket Hook (singleton, exponential backoff reconnect) | ✅ |
| Live sensor card grid with status badges | ✅ |
| Actuator Panel with toggle | ✅ |
| Rule Manager (full CRUD) | ✅ |
| Event Log (real-time WS feed) | ✅ |
| Nginx SPA + API/WS proxy config | ✅ |

#### 🔧 Known Gaps
| # | Issue | Severity |
|---|-------|----------|
| 1 | `SensorChart` built but not mounted in Dashboard | Medium |
| 2 | No delete confirmation dialog in RuleManager | Low |
| 3 | No client-side form validation in RuleForm | Low |
| 4 | ActuatorPanel doesn't live-update from WS | Low |

### Infrastructure — ✅ `COMPLETE`

| Component | Status |
|-----------|--------|
| `docker-compose.yml` — 8 services with healthchecks | ✅ |
| PostgreSQL `pgdata` volume for rule persistence | ✅ |
| Kafka `sensor.events` + `actuator.events` topics | ✅ |
| All service Dockerfiles | ✅ |

---

## Remaining Work

### Frontend (React SPA)

- [ ] Mount `SensorChart` in `Dashboard.jsx` (US-05)
- [ ] Add delete confirmation dialog in `RuleManager` (US-11)
- [ ] Add client-side form validation in `RuleForm` (sensor names, metric, operator, threshold)
- [ ] Wire `ActuatorPanel` to live WS `actuator_update` events so toggles refresh in real-time

### Documentation & Deliverables

- [ ] Write `input.md` — user stories, unified event schema, rule model (required deliverable)
- [ ] Write `Student_doc.md` — deployed system specifics (required deliverable)
- [ ] Prepare presentation slides in `booklets/` (PDF)
- [ ] Create LoFi mockups per user story in `booklets/lofi_mockups/`
- [ ] Add architecture diagram export (PNG) in `booklets/`

---

## User Story Coverage

| ID | Story | Status |
|----|-------|--------|
| US-01 | See list of all sensors | ✅ |
| US-02 | See latest value of each sensor | ✅ |
| US-03 | Real-time updates without refresh | ✅ |
| US-04 | Status badges (ok/warning) | ✅ |
| US-05 | Time-series chart | ⚠️ Component built, not mounted |
| US-06 | See actuator states | ✅ |
| US-07 | Manually toggle actuator | ✅ |
| US-08 | Create automation rule | ✅ |
| US-09 | View all rules | ✅ |
| US-10 | Edit existing rule | ✅ |
| US-11 | Delete a rule | ⚠️ Works, no confirmation dialog |
| US-12 | Rules persist across restarts | ✅ |
| US-13 | Enable/disable rule | ✅ |
| US-14 | Live event/trigger log | ✅ |
| US-15 | One-command launch | ✅ |

---

*Last updated: March 6, 2026*
