# Mars Habitat Automation Platform

## Project Overview

A distributed IoT platform for managing telemetry, environmental controls, and automation in a simulated Mars Habitat. The system ingests sensor data from a Mars IoT simulator, processes automation rules in real-time, controls actuators, and presents a live monitoring dashboard.

**Architecture:** 3 Python microservices + React SPA, connected via Apache Kafka, backed by PostgreSQL, all orchestrated with Docker Compose.

---

## Current Build Status

### Backend — `COMPLETE`

All three Python/FastAPI microservices are fully implemented with real logic (zero stubs, zero TODOs).

#### `ingestion-service` (9 files) — ✅ Done
| Component | Status | Notes |
|-----------|--------|-------|
| REST Poller (8 sensors) | ✅ | Polls all 8 REST sensors on configurable interval via `httpx` |
| SSE Streamer (7 topics) | ✅ | One `asyncio` task per topic, auto-reconnect on failure |
| Event Normalizer (8 schemas) | ✅ | All 8 schema families mapped to unified format |
| Kafka Producer | ✅ | Async producer with `send_and_wait`, keyed by `sensor_id` |
| Unified Event Model | ✅ | Pydantic model matching the schema contract |
| FastAPI Lifespan | ✅ | Starts producer + background tasks, graceful shutdown |

#### `processing-service` (13 files) — ✅ Done
| Component | Status | Notes |
|-----------|--------|-------|
| Kafka Consumer | ✅ | Consumes `sensor.events`, inline producer for `actuator.events` |
| State Cache | ✅ | Thread-safe in-memory `dict` with async lock |
| Rule Engine / Evaluator | ✅ | 5 operators (`<`, `<=`, `=`, `>`, `>=`), sensor+metric matching |
| Actuator Client | ✅ | POST/GET to simulator actuator endpoints via `httpx` |
| Rules CRUD API | ✅ | Full REST: GET, POST, GET/{id}, PUT/{id}, DELETE/{id} |
| State API | ✅ | GET /api/state, GET /api/state/{sensor_id} |
| Actuators API | ✅ | GET /api/actuators, POST /api/actuators/{name} |
| PostgreSQL ORM | ✅ | SQLAlchemy async + `asyncpg`, `automation_rules` table |
| Rule Repository | ✅ | Full async CRUD with partial update support |

#### `dashboard-service` (6 files) — ✅ Done
| Component | Status | Notes |
|-----------|--------|-------|
| Kafka Consumer | ✅ | Subscribes to `sensor.events` + `actuator.events` |
| WebSocket Manager | ✅ | Multi-client broadcast, dead connection cleanup |
| REST API Proxy | ✅ | All 9 endpoints proxied to `processing-service` |
| WS Message Envelope | ✅ | `sensor_update` / `actuator_update` types per contract |

---

### Frontend — `~90% COMPLETE`

React 18 + Vite + Material UI. All 24 source files contain real implementation (no stubs).

#### ✅ Fully Implemented
| Component | Status | Notes |
|-----------|--------|-------|
| React Router (4 routes) | ✅ | `/`, `/actuators`, `/rules`, `/events` |
| MUI Dark Theme (Mars palette) | ✅ | Rust-orange primary, amber secondary |
| WebSocket Hook (singleton) | ✅ | Auto-reconnect with exponential backoff (1s–30s) |
| Sensor Data Hook | ✅ | Live `sensors` map + `history` arrays from WS |
| Dashboard (sensor card grid) | ✅ | Live values, status badges, timestamps |
| StatusBadge | ✅ | Green (ok) / amber (warning) chip |
| Actuator Panel + Toggle | ✅ | Fetch states + POST toggle |
| Rule Manager (full CRUD) | ✅ | Create, edit, delete, enable/disable |
| Rule Form (dialog) | ✅ | All fields: sensor, metric, operator, threshold, actuator, state |
| Event Log (real-time table) | ✅ | WS-fed actuator events, newest first |
| Header + Connection Indicator | ✅ | Live / Disconnected chip |
| Sidebar Navigation | ✅ | Active route highlighting |
| Nginx Config (prod) | ✅ | SPA fallback + API/WS proxy |
| Multi-stage Dockerfile | ✅ | Node build → Nginx serve |

#### 🔧 Known Gaps (Minor)
| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | `SensorChart` not mounted | Medium | Component is fully built (Recharts LineChart) but never rendered in `Dashboard.jsx`. US-05 requires time-series charts. |
| 2 | No delete confirmation | Low | `RuleManager` deletes immediately without a confirmation dialog (US-11 acceptance criteria). |
| 3 | No form validation | Low | `RuleForm` allows submitting empty sensor/metric fields. |
| 4 | Actuators not WS-updated | Low | `ActuatorPanel` only fetches on mount; doesn't refresh from WS events. |
| 5 | `formatters.js` unused | Trivial | Utility functions exist but no component imports them. |

---

### Infrastructure — `COMPLETE`

| Component | Status | Notes |
|-----------|--------|-------|
| `docker-compose.yml` | ✅ | 8 services: simulator, zookeeper, kafka, postgres, 3 microservices, frontend |
| Service Healthchecks | ✅ | All infra services have healthchecks with `depends_on` conditions |
| PostgreSQL Volume | ✅ | `pgdata` volume for rule persistence across restarts |
| Kafka Topics | ✅ | `sensor.events` + `actuator.events`, 1-hour retention |
| Port Mappings | ✅ | Simulator:8080, Processing:8001, Dashboard:8002, Frontend:3000 |
| All Dockerfiles | ✅ | Python 3.12-slim (backends), Node+Nginx multi-stage (frontend) |
| `.gitignore` | ✅ | Python, Node, OS, IDE, OCI artifacts excluded |

---

### 🚧 Remaining Work

#### Must Do
- [ ] Mount `SensorChart` in `Dashboard.jsx` (US-05)
- [ ] Boot Docker Compose and integration-test
- [ ] Load `mars-iot-simulator` Docker image into local daemon
- [ ] End-to-end test: sensor → Kafka → rule evaluation → actuator trigger

#### Should Do
- [ ] Add delete confirmation dialog in `RuleManager` (US-11)
- [ ] Add client-side form validation in `RuleForm`
- [ ] Wire `ActuatorPanel` to WS for live state updates
- [ ] Use `formatters.js` utilities in components

---

### User Story Coverage

| ID | Story | Status |
|----|-------|--------|
| US-01 | See list of all sensors | ✅ Backend + Frontend |
| US-02 | See latest value of each sensor | ✅ Backend + Frontend |
| US-03 | Real-time updates without refresh | ✅ WebSocket pipeline |
| US-04 | Status badges (ok/warning) | ✅ `StatusBadge` component |
| US-05 | Time-series chart | ⚠️ Component exists, not mounted |
| US-06 | See actuator states | ✅ Backend + Frontend |
| US-07 | Manually toggle actuator | ✅ Backend + Frontend |
| US-08 | Create automation rule | ✅ Backend + Frontend |
| US-09 | View all rules | ✅ Backend + Frontend |
| US-10 | Edit existing rule | ✅ Backend + Frontend |
| US-11 | Delete a rule | ⚠️ Works but no confirmation dialog |
| US-12 | Rules persist across restarts | ✅ PostgreSQL + volume |
| US-13 | Enable/disable rule | ✅ Backend + Frontend |
| US-14 | Live event/trigger log | ✅ `EventLog` component |
| US-15 | One-command launch | ✅ `docker compose up` |

---

*Last updated: March 6, 2026*
