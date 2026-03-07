# Mars Habitat Automation Platform — System Documentation

This document contains the full technical specification of the deployed system.

---

# SYSTEM DESCRIPTION:

The Mars Habitat Automation Platform is a microservices-based IoT monitoring and automation system for a simulated Mars habitat. It collects real-time sensor data from a Mars IoT simulator (REST polling + SSE telemetry streams), normalizes heterogeneous payloads into a unified internal event schema, evaluates user-defined automation rules, controls actuators, and provides a live dashboard for operators.

**Architecture**: Event-driven microservices communicating via Apache Kafka, with a React SPA frontend served by Nginx.

**Orchestration**: Docker Compose (`docker-compose.yml`, version 3.9)

---

# USER STORIES:

1) As a user, I want to be able to see the data from all sensors in an ordered page
2) As a user, I want to see the newest data possible from the telemetry sensors
3) As a user, I want to see which automation rules are currently active
4) As a user, I want to be able to override the automation rules manually
5) As a user, I want to see an alert if the status for a sensor reaches a critical value
6) As a user, I want to see graphs that show how the telemetry data evolves
7) As a user, I want to monitor the greenhouse temperature and the hydroponic ph to ensure survival of the crops
8) As a user, I want the platform to automatically update when an actuator state changes so I don't have to refresh the page
9) As a user, I want to know when the data was produced for all sensors
10) As a user, I want the data from all the sensors to be coherent and to have a clear unit of measurement
11) As a user, I want to see the status of the connection to the simulator, to ensure I'm receiving data correctly
12) As a user, I want the system to automatically discover new sensors and telemetry topics from the simulator so I don't have to hardcode new hardware
13) As a user, I want automation rules to survive a system restart and not to have to set everything up again
14) As a user, I want to compare the power consumption and the power bus to make sure the habitat is not in a power deficit
15) As a user, I want to be alerted if there is a power deficit

---

# CONTAINERS:

## Infrastructure Containers

## CONTAINER_NAME: Simulator

### DESCRIPTION:
Provided Mars IoT simulator (unmodifiable). Exposes REST endpoints for polling sensor data, SSE streams for telemetry topics, and POST endpoints for actuator control.

### USER STORIES:
1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15 — all sensor/actuator data originates from this container.

### PORTS:
8080:8080

| Property       | Value                              |
|----------------|-------------------------------------|
| Image          | `mars-iot-simulator:multiarch_v1`  |
| Internal Port  | 8080                               |
| External Port  | 8080                               |
| Healthcheck    | `GET http://localhost:8080/health`  |

### PERSISTANCE EVALUATION
The Simulator container does not persist data. All sensor values are generated in real-time.

### EXTERNAL SERVICES CONNECTIONS
The Simulator container does not connect to external services.

---

## CONTAINER_NAME: Zookeeper

### DESCRIPTION:
Coordination service required by Kafka. No external port exposed.

### USER STORIES:
No user stories directly associated. Infrastructure dependency for Kafka.

### PORTS:
2181 (internal only)

| Property       | Value                              |
|----------------|-------------------------------------|
| Image          | `confluentinc/cp-zookeeper:7.6.0`  |
| Client Port    | 2181 (internal only)               |

### PERSISTANCE EVALUATION
The Zookeeper container does not require persistent storage.

### EXTERNAL SERVICES CONNECTIONS
The Zookeeper container does not connect to external services.

---

## CONTAINER_NAME: Kafka

### DESCRIPTION:
Message broker. Central to the event-driven architecture. Two topics used:
- `sensor.events` — normalized sensor readings (produced by ingestion-service, consumed by processing-service and dashboard-service)
- `actuator.events` — actuator state changes (produced by processing-service, consumed by dashboard-service)

### USER STORIES:
1, 2, 5, 6, 7, 8, 9, 10, 14, 15 — all real-time data flows through Kafka.

### PORTS:
9092:9092

| Property       | Value                              |
|----------------|-------------------------------------|
| Image          | `confluentinc/cp-kafka:7.6.0`     |
| Internal Port  | 9092                               |
| External Port  | 9092                               |
| Depends On     | Zookeeper (healthy)                |

**Key Configuration**:
- `KAFKA_AUTO_CREATE_TOPICS_ENABLE: true`
- `KAFKA_LOG_RETENTION_MS: 3600000` (1-hour retention)
- `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1` (single-broker setup)

### PERSISTANCE EVALUATION
Kafka retains messages for 1 hour (`LOG_RETENTION_MS: 3600000`). No permanent storage required; historical data is not needed.

### EXTERNAL SERVICES CONNECTIONS
The Kafka container does not connect to external services. Communicates only with Zookeeper and application services within the Docker network.

---

## CONTAINER_NAME: PostgreSQL

### DESCRIPTION:
Relational database for persisting automation rules. Uses a named Docker volume for data durability across container restarts.

### USER STORIES:
3, 13 — rules are persisted in PostgreSQL so they survive restarts and can be listed.

### PORTS:
5432:5432

| Property       | Value                              |
|----------------|-------------------------------------|
| Image          | `postgres:16-alpine`               |
| Internal Port  | 5432                               |
| External Port  | 5432                               |
| Volume         | `pgdata:/var/lib/postgresql/data`  |

### PERSISTANCE EVALUATION
The PostgreSQL container requires persistent storage. A named Docker volume `pgdata` persists the database across container restarts.

### EXTERNAL SERVICES CONNECTIONS
The PostgreSQL container does not connect to external services. Only accessed by the processing-service within the Docker network.

**Database Configuration**:
- Database name: `mars_rules`
- User: `mars`
- Password: `mars`

**Schema — `automation_rules` table**:

| Column           | Type          | Constraints                          |
|------------------|---------------|--------------------------------------|
| `id`             | Integer       | Primary key, auto-increment         |
| `sensor_name`    | String(100)   | NOT NULL, indexed                   |
| `metric`         | String(100)   | NOT NULL                            |
| `operator`       | String(2)     | NOT NULL (`<`, `<=`, `=`, `>`, `>=`) |
| `threshold`      | Float         | NOT NULL                            |
| `unit`           | String(50)    | Nullable (informational, e.g. "°C") |
| `actuator_name`  | String(100)   | NOT NULL                            |
| `actuator_state` | String(3)     | NOT NULL (`ON` or `OFF`)            |
| `enabled`        | Boolean       | Default `True`, indexed             |
| `created_at`     | DateTime      | Default `utcnow`                    |
| `updated_at`     | DateTime      | Default `utcnow`, auto-updated      |

**Rule semantics**: `IF <sensor_name>.<metric> <operator> <threshold> THEN set <actuator_name> to <actuator_state>`

---

# Application Services

---

## CONTAINER_NAME: Ingestion Service

### DESCRIPTION:
Collects data from the Mars IoT simulator via two mechanisms (REST polling and SSE streaming), normalizes readings into a `UnifiedEvent` schema, and publishes them to Kafka.

### USER STORIES:
2, 9, 10, 12 — ingests real-time telemetry data, normalizes payloads into coherent schema with units, auto-discovers sensors/topics.

### PORTS:
No external port (internal only)

### PERSISTANCE EVALUATION
The Ingestion Service does not require data persistence. It is a stateless data pipeline.

### EXTERNAL SERVICES CONNECTIONS

| Target     | Protocol | Purpose                                                    |
|------------|----------|------------------------------------------------------------|
| Simulator  | HTTP GET | Polls REST sensor endpoints (8 sensors by default)         |
| Simulator  | SSE      | Subscribes to 7 telemetry topics via Server-Sent Events    |
| Kafka      | TCP      | Produces normalized events to `sensor.events` topic        |

### MICROSERVICES:

#### MICROSERVICE: ingestion-service
- TYPE: backend

### Docker Configuration

| Property       | Value              |
|----------------|--------------------|
| Base Image     | `python:3.12-slim` |
| Internal Port  | 8000               |
| External Port  | None (internal only)|
| Entrypoint     | `uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info` |
| Restart Policy | `unless-stopped`   |

### Dependencies (`requirements.txt`)

| Package              | Version  | Purpose                              |
|----------------------|----------|--------------------------------------|
| `fastapi`            | 0.115.6  | Web framework                        |
| `uvicorn[standard]`  | 0.34.0   | ASGI server                          |
| `aiokafka`           | 0.12.0   | Async Kafka producer                 |
| `httpx`              | 0.28.1   | Async HTTP client (polling + SSE)    |
| `pydantic`           | 2.10.5   | Data validation                      |

### Environment Variables

| Variable                  | Value (Docker Compose)        | Default              |
|---------------------------|-------------------------------|----------------------|
| `SIMULATOR_URL`           | `http://simulator:8080`       | `http://localhost:8080` |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092`                  | `localhost:9092`     |
| `POLL_INTERVAL_SECONDS`   | `5`                           | `5`                  |
| `DISCOVERY_INTERVAL_SECONDS` | (not set)                  | `30`                 |
| `SENSOR_EVENTS_TOPIC`     | (not set)                     | `sensor.events`      |

### Startup Behavior (`main.py` lifespan)

1. **Discovery**: Calls `initial_discovery()` to auto-detect REST sensors and telemetry topics from the simulator. Falls back to hardcoded defaults on failure.
2. **Kafka Producer**: Initializes an async Kafka producer connected to `KAFKA_BOOTSTRAP_SERVERS`.
3. **Background Tasks** (3 concurrent `asyncio.Task`s):
   - `run_rest_polling_loop(producer)` — polls all REST sensors at `POLL_INTERVAL_SECONDS` interval
   - `run_telemetry_streams(producer)` — opens persistent SSE connections to all telemetry topics
   - `run_discovery_loop()` — periodically re-discovers sensors/topics every `DISCOVERY_INTERVAL_SECONDS`

### HTTP Endpoints

| HTTP Method | URL      | Description       | User Stories |
|--------|-----------|-------------------|--------------|
| `GET`  | `/health` | Health check — returns `{"status": "ok", "service": "ingestion-service"}` | — |

### External Service Connections

| Target     | Protocol | Purpose                                                    |
|------------|----------|------------------------------------------------------------|
| Simulator  | HTTP GET | Polls REST sensor endpoints (8 sensors by default)         |
| Simulator  | SSE      | Subscribes to 7 telemetry topics via Server-Sent Events    |
| Kafka      | TCP      | Produces normalized events to `sensor.events` topic        |

### Sensor Registries (Defaults)

**REST Sensors** (polled):
| Sensor ID                  | Schema Family          |
|----------------------------|------------------------|
| `greenhouse_temperature`   | `rest.scalar.v1`       |
| `entrance_humidity`        | `rest.scalar.v1`       |
| `co2_hall`                 | `rest.scalar.v1`       |
| `corridor_pressure`        | `rest.scalar.v1`       |
| `hydroponic_ph`            | `rest.chemistry.v1`    |
| `water_tank_level`         | `rest.level.v1`        |
| `air_quality_pm25`         | `rest.particulate.v1`  |
| `air_quality_voc`          | `rest.chemistry.v1`    |

**Telemetry Topics** (SSE):
| Topic Path                          | Schema Family              |
|-------------------------------------|----------------------------|
| `mars/telemetry/solar_array`        | `topic.power.v1`           |
| `mars/telemetry/radiation`          | `topic.environment.v1`     |
| `mars/telemetry/life_support`       | `topic.environment.v1`     |
| `mars/telemetry/thermal_loop`       | `topic.thermal_loop.v1`    |
| `mars/telemetry/power_bus`          | `topic.power.v1`           |
| `mars/telemetry/power_consumption`  | `topic.power.v1`           |
| `mars/telemetry/airlock`            | `topic.airlock.v1`         |

### Key Architectural Decisions
- **Dynamic discovery**: Sensors and topics are auto-discovered from the simulator at startup and periodically refreshed, with hardcoded defaults as fallback.
- **No external port**: The ingestion service is internal-only — it has no reason to be accessed from outside the Docker network.
- **Stateless**: No database or persistence; it is a pure data pipeline.

---

## CONTAINER_NAME: Processing Service

### DESCRIPTION:
Consumes normalized sensor events from Kafka, evaluates user-defined automation rules stored in PostgreSQL, triggers actuator commands on the simulator when conditions are met, and exposes REST APIs for rules CRUD, sensor state queries, and actuator control.

### USER STORIES:
3, 4, 5, 8, 13 — manages automation rules (CRUD + persistence), evaluates rules in real-time, triggers actuators, maintains sensor state cache.

### PORTS:
8001:8001

### PERSISTANCE EVALUATION
The Processing Service requires persistent storage for automation rules. Uses PostgreSQL with SQLAlchemy async ORM. Also maintains an in-memory `StateCache` for latest sensor readings (volatile, lost on restart).

### EXTERNAL SERVICES CONNECTIONS

| Target     | Protocol   | Purpose                                           |
|------------|------------|---------------------------------------------------|
| Kafka      | TCP        | Consumes `sensor.events`, produces `actuator.events` |
| PostgreSQL | TCP (5432) | Stores/retrieves automation rules                 |
| Simulator  | HTTP POST  | Sends actuator commands                           |

### MICROSERVICES:

#### MICROSERVICE: processing-service
- TYPE: backend

### Docker Configuration

| Property       | Value              |
|----------------|--------------------|
| Base Image     | `python:3.12-slim` |
| Internal Port  | 8001               |
| External Port  | 8001               |
| Entrypoint     | `uvicorn app.main:app --host 0.0.0.0 --port 8001 --log-level info` |
| Restart Policy | `unless-stopped`   |

### Dependencies (`requirements.txt`)

| Package              | Version  | Purpose                              |
|----------------------|----------|--------------------------------------|
| `fastapi`            | 0.115.6  | Web framework                        |
| `uvicorn[standard]`  | 0.34.0   | ASGI server                          |
| `aiokafka`           | 0.12.0   | Async Kafka consumer/producer        |
| `httpx`              | 0.28.1   | Async HTTP client (actuator commands)|
| `pydantic`           | 2.10.5   | Data validation                      |
| `sqlalchemy[asyncio]`| 2.0.36   | Async ORM (PostgreSQL)               |
| `asyncpg`            | 0.30.0   | Async PostgreSQL driver              |

### Environment Variables

| Variable                  | Value (Docker Compose)                                     | Default                                                       |
|---------------------------|------------------------------------------------------------|---------------------------------------------------------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092`                                               | `localhost:9092`                                              |
| `DATABASE_URL`            | `postgresql+asyncpg://mars:mars@postgres:5432/mars_rules`  | `postgresql+asyncpg://mars:mars@localhost:5432/mars_rules`    |
| `SIMULATOR_URL`           | `http://simulator:8080`                                    | `http://localhost:8080`                                       |
| `SENSOR_EVENTS_TOPIC`     | (not set)                                                  | `sensor.events`                                               |
| `ACTUATOR_EVENTS_TOPIC`   | (not set)                                                  | `actuator.events`                                             |
| `CONSUMER_GROUP_ID`       | (not set)                                                  | `processing-group`                                            |

### Startup Behavior (`main.py` lifespan)

1. **Database init**: Calls `init_db()` which uses SQLAlchemy `create_all` to create/verify the `automation_rules` table.
2. **Kafka consumer**: Launches `run_kafka_consumer(state_cache)` as a background `asyncio.Task`.

### HTTP Endpoints

#### Health
| HTTP Method | URL      | Description       | User Stories |
|--------|-----------|-------------------|--------------|
| `GET`  | `/health` | Health check — returns `{"status": "ok", "service": "processing-service"}` | — |

#### Rules CRUD (`/api/rules`)
| HTTP Method   | URL               | Description                                    | User Stories |
|----------|--------------------|------------------------------------------------|--------------|
| `GET`    | `/api/rules`       | List all automation rules                      | 3 |
| `POST`   | `/api/rules`       | Create a new rule (validates operator ∈ `{<,<=,=,>,>=}`, state ∈ `{ON,OFF}`) — returns 201 | 3, 13 |
| `GET`    | `/api/rules/{id}`  | Get a single rule by ID — 404 if not found     | 3 |
| `PUT`    | `/api/rules/{id}`  | Update an existing rule — 404 if not found     | 4 |
| `DELETE` | `/api/rules/{id}`  | Delete a rule — returns 204 on success, 404 if not found | 3 |

#### Sensor State (`/api/state`)
| HTTP Method | URL                    | Description                                          | User Stories |
|--------|-------------------------|------------------------------------------------------|--------------|
| `GET`  | `/api/state`            | Get latest cached reading for all sensors (`{"sensors": {...}}`) | 1, 7 |
| `GET`  | `/api/state/{sensor_id}`| Get latest cached reading for a specific sensor — 404 if not yet seen | 1, 7 |

#### Actuators (`/api/actuators`)
| HTTP Method | URL                          | Description                                          | User Stories |
|--------|-------------------------------|------------------------------------------------------|--------------|
| `GET`  | `/api/actuators`              | Get current state of all actuators from simulator — 502 if unreachable | 4 |
| `POST` | `/api/actuators/{name}`       | Set actuator state (body: `{"state": "ON"|"OFF"}`) — 400 if invalid, 502 if unreachable | 4 |

### Kafka Consumer Pipeline (background task)

For each event consumed from `sensor.events`:
1. **Update state cache**: Stores the event in the in-memory `StateCache` (keyed by `sensor_id`, protected by `asyncio.Lock`).
2. **Load enabled rules**: Queries PostgreSQL for all rules where `enabled = True`.
3. **Evaluate rules**: For each rule, the evaluator checks:
   - Sensor match: `rule.sensor_name` (spaces→underscores) == `event.sensor_id`
   - Metric match: finds measurement in `event.measurements[]` where `metric == rule.metric`
   - Threshold comparison: applies `rule.operator` to `measurement.value` vs `rule.threshold`
4. **Trigger actuator**: If a rule fires, sends `POST` to `SIMULATOR_URL/api/actuators/{name}` with `{"state": "ON"|"OFF"}`.
5. **Publish actuator event**: Sends result to `actuator.events` Kafka topic with key = `actuator_name`.

### Persistence

- **PostgreSQL**: `automation_rules` table (see schema above). Connection pool: size 5, max overflow 10.
- **In-memory `StateCache`**: Volatile cache of latest sensor readings. Lost on restart. Thread-safe via `asyncio.Lock`.

### External Service Connections

| Target     | Protocol   | Purpose                                           |
|------------|------------|---------------------------------------------------|
| Kafka      | TCP        | Consumes `sensor.events`, produces `actuator.events` |
| PostgreSQL | TCP (5432) | Stores/retrieves automation rules                 |
| Simulator  | HTTP POST  | Sends actuator commands                           |

### Key Architectural Decisions
- **Dual Kafka role**: Both consumer (sensor events) and producer (actuator events).
- **Session-per-request**: Database sessions are dependency-injected via FastAPI, with auto-commit/rollback.
- **Sensor name normalization**: Spaces in `sensor_name` are replaced with underscores for matching against `sensor_id`.
- **State cache is volatile**: Designed for fast lookups only; no persistence needed since events stream continuously.

- DB STRUCTURE:

	**_automation_rules_** :	| **_id_** | sensor_name | metric | operator | threshold | unit | actuator_name | actuator_state | enabled | created_at | updated_at |

---

## CONTAINER_NAME: Dashboard Service

### DESCRIPTION:
Acts as the single backend gateway for the React frontend. Relays real-time sensor and actuator events via WebSocket, and proxies all REST API calls to the Processing Service.

### USER STORIES:
1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 14, 15 — serves as the single backend gateway for all frontend interactions.

### PORTS:
8082:8002

### PERSISTANCE EVALUATION
The Dashboard Service does not require data persistence. It is a stateless proxy and WebSocket relay.

### EXTERNAL SERVICES CONNECTIONS

| Target              | Protocol   | Purpose                                          |
|---------------------|------------|--------------------------------------------------|
| Kafka               | TCP        | Consumes `sensor.events` and `actuator.events`   |
| Processing Service  | HTTP       | Proxies all `/api/*` REST calls                  |
| Frontend clients    | WebSocket  | Pushes real-time updates                         |

### MICROSERVICES:

#### MICROSERVICE: dashboard-service
- TYPE: backend

### Docker Configuration

| Property       | Value              |
|----------------|--------------------|
| Base Image     | `python:3.12-slim` |
| Internal Port  | 8002               |
| External Port  | 8082               |
| Entrypoint     | `uvicorn app.main:app --host 0.0.0.0 --port 8002 --log-level info` |
| Restart Policy | `unless-stopped`   |

### Dependencies (`requirements.txt`)

| Package              | Version  | Purpose                                  |
|----------------------|----------|------------------------------------------|
| `fastapi`            | 0.115.6  | Web framework                            |
| `uvicorn[standard]`  | 0.34.0   | ASGI server                              |
| `aiokafka`           | 0.12.0   | Async Kafka consumer                     |
| `httpx`              | 0.28.1   | Async HTTP client (proxying to processing-service) |
| `pydantic`           | 2.10.5   | Data validation                          |

### Environment Variables

| Variable                  | Value (Docker Compose)               | Default                  |
|---------------------------|--------------------------------------|--------------------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092`                         | `localhost:9092`         |
| `PROCESSING_SERVICE_URL`  | `http://processing-service:8001`     | `http://localhost:8001`  |
| `SENSOR_EVENTS_TOPIC`     | (not set)                            | `sensor.events`          |
| `ACTUATOR_EVENTS_TOPIC`   | (not set)                            | `actuator.events`        |
| `CONSUMER_GROUP_ID`       | (not set)                            | `dashboard-group`        |

### Startup Behavior (`main.py` lifespan)

1. **CORS middleware**: Configured with `allow_origins=["*"]` for frontend access.
2. **Kafka consumer**: Launches `run_kafka_consumer(ws_manager)` as a background `asyncio.Task`.

### HTTP/WS Endpoints

| HTTP Method      | URL                          | Description                                           | User Stories |
|-------------|-------------------------------|-------------------------------------------------------|--------------|
| `GET`       | `/health`                     | Health check — returns status + active WS connection count | — |
| `WebSocket` | `/ws`                         | Real-time event stream for frontend clients           | 2, 6, 8 |

#### Proxy Endpoints (forwarded to Processing Service)

| HTTP Method   | URL                          | Proxied To                              | User Stories |
|----------|-------------------------------|-----------------------------------------|--------------|
| `GET`    | `/api/rules`                  | `processing-service:8001/api/rules`     | 3 |
| `POST`   | `/api/rules`                  | `processing-service:8001/api/rules`     | 3, 13 |
| `GET`    | `/api/rules/{rule_id}`        | `processing-service:8001/api/rules/{rule_id}` | 3 |
| `PUT`    | `/api/rules/{rule_id}`        | `processing-service:8001/api/rules/{rule_id}` | 4 |
| `DELETE` | `/api/rules/{rule_id}`        | `processing-service:8001/api/rules/{rule_id}` | 3 |
| `GET`    | `/api/state`                  | `processing-service:8001/api/state`     | 1, 7 |
| `GET`    | `/api/state/{sensor_id}`      | `processing-service:8001/api/state/{sensor_id}` | 1, 7 |
| `GET`    | `/api/actuators`              | `processing-service:8001/api/actuators` | 4 |
| `POST`   | `/api/actuators/{name}`       | `processing-service:8001/api/actuators/{name}` | 4 |

### Kafka Consumer (background task)

Subscribes to both `sensor.events` and `actuator.events` (separate consumer group: `dashboard-group`). For each message:
- Wraps it in a typed envelope: `{"type": "sensor_update"|"actuator_update", "data": <event>}`
- Broadcasts via `WebSocketManager.broadcast()` to all connected frontend clients

### WebSocket Manager

- Maintains a list of active `WebSocket` connections
- `connect()` accepts and registers new connections
- `disconnect()` removes connections
- `broadcast()` sends JSON to all active clients; automatically cleans up dead connections on send failure

### External Service Connections

| Target              | Protocol   | Purpose                                          |
|---------------------|------------|--------------------------------------------------|
| Kafka               | TCP        | Consumes `sensor.events` and `actuator.events`   |
| Processing Service  | HTTP       | Proxies all `/api/*` REST calls                  |
| Frontend clients    | WebSocket  | Pushes real-time updates                         |

### Key Architectural Decisions
- **API Gateway pattern**: Frontend talks to a single backend; the dashboard-service fans out to internal services.
- **Separate Kafka consumer group** (`dashboard-group`): Independent from the processing-service consumer group, so both services receive every event.
- **Stateless proxy**: Uses a persistent `httpx.AsyncClient` with 10s timeout for efficient connection reuse.

---

## CONTAINER_NAME: Frontend

### DESCRIPTION:
React Single-Page Application (SPA) providing a real-time monitoring dashboard for the Mars Habitat. Built with Vite, served by Nginx in production, with reverse-proxy routing to the dashboard-service.

### USER STORIES:
1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 14, 15 — all user-facing stories are implemented in the frontend.

### PORTS:
3000:80

### PERSISTANCE EVALUATION
The Frontend container does not include a database.

### EXTERNAL SERVICES CONNECTIONS
The Frontend container connects to the dashboard-service via HTTP (REST API proxy) and WebSocket (real-time updates). No external third-party services.

### MICROSERVICES:

#### MICROSERVICE: frontend
- TYPE: frontend

### Docker Configuration (Multi-Stage Build)

| Stage        | Base Image        | Purpose                        |
|--------------|-------------------|--------------------------------|
| Build        | `node:20-alpine`  | `npm install` + `npm run build`|
| Serve        | `nginx:alpine`    | Serves static files            |

| Property       | Value              |
|----------------|--------------------|
| Internal Port  | 80 (Nginx)         |
| External Port  | 3000               |
| Restart Policy | `unless-stopped`   |

### Dependencies (`package.json`)

**Runtime Dependencies**:

| Package              | Version    | Purpose                              |
|----------------------|------------|--------------------------------------|
| `react`              | ^18.3.1    | UI library                           |
| `react-dom`          | ^18.3.1    | React DOM renderer                   |
| `react-router-dom`   | ^6.28.0    | Client-side routing                  |
| `@mui/material`      | ^5.16.14   | Material UI component library        |
| `@mui/icons-material`| ^5.16.14   | Material UI icons                    |
| `@emotion/react`     | ^11.13.5   | CSS-in-JS (MUI peer dependency)      |
| `@emotion/styled`    | ^11.13.5   | Styled components (MUI peer dep)     |
| `tailwindcss`        | ^4.2.1     | Utility-first CSS framework          |
| `@tailwindcss/vite`  | ^4.2.1     | Tailwind Vite plugin                 |
| `recharts`           | ^2.13.3    | Charting library                     |
| `axios`              | ^1.7.9     | HTTP client                          |
| `lottie-react`       | ^2.4.1     | Lottie animation rendering           |
| `lucide-react`       | ^0.577.0   | Icon library                         |

**Dev Dependencies**:

| Package              | Version    | Purpose                              |
|----------------------|------------|--------------------------------------|
| `vite`               | ^5.4.14    | Build tool / dev server              |
| `@vitejs/plugin-react`| ^4.3.4   | React HMR + JSX support              |
| `@types/react`       | ^18.3.12   | TypeScript type definitions          |
| `@types/react-dom`   | ^18.3.1    | TypeScript type definitions          |

### Nginx Configuration (`nginx.conf`)

| Route       | Behavior                                                      |
|-------------|---------------------------------------------------------------|
| `/`         | Serves React SPA from `/usr/share/nginx/html` with `try_files` fallback to `index.html` (SPA routing) |
| `/api/*`    | Reverse-proxies to `http://dashboard-service:8002/api/`       |
| `/ws`       | Reverse-proxies WebSocket to `http://dashboard-service:8002/ws` (with `Upgrade` headers) |

### Vite Dev Config (`vite.config.js`)

During local development (`npm run dev`):
- `/api` proxied to `http://localhost:8082`
- `/ws` proxied to `ws://localhost:8082`
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`

### External Service Connections

| Target              | Protocol   | Purpose                              |
|---------------------|------------|--------------------------------------|
| Dashboard Service   | HTTP       | REST API calls via `/api/*` proxy    |
| Dashboard Service   | WebSocket  | Real-time sensor/actuator updates via `/ws` |

### Key Architectural Decisions
- **Multi-stage Docker build**: Node.js for compilation, Nginx Alpine for minimal production image.
- **Nginx as reverse proxy**: All backend traffic goes through Nginx, so the frontend only needs to know its own origin — no CORS issues in production.
- **Dual styling**: MUI for structured components + Tailwind CSS for utility-based layout.
- **Lottie animations**: Mars-themed loading animations via `lottie-react`.

### PAGES:

| Name | Route | Description | Related Microservice | User Stories |
| ---- | ----- | ----------- | -------------------- | ------------ |
| Dashboard | `/` | Main real-time sensor monitoring view. Shows stat cards (total sensors, healthy count, warnings, connection status), priority readings for featured sensors, power overview comparing supply vs consumption, and grids of REST and Telemetry sensor cards with live charts. | dashboard-service (WebSocket + REST `/api/state`) | 1, 2, 5, 6, 7, 9, 11, 14, 15 |
| ActuatorPanel | `/actuators` | Displays a grid of actuator cards with current ON/OFF state. Users can manually toggle each actuator. State updates arrive in real-time via WebSocket. | dashboard-service (REST `/api/actuators` + WebSocket) | 4, 8 |
| RuleManager | `/rules` | CRUD interface for automation rules. Lists all rules (sorted enabled-first), allows creating, editing, toggling, and deleting rules via a confirmation dialog. | dashboard-service (REST `/api/rules` proxy → processing-service) | 3, 4, 13 |
| EventLog | `/events` | Scrolling table of actuator trigger events showing timestamp, actuator name, state, rule number, and triggering sensor. Events accumulated from WebSocket stream. | dashboard-service (WebSocket only) | 8 |

---

# Port Mapping Summary

| Service              | Internal Port | External Port | Protocol  |
|----------------------|---------------|---------------|-----------|
| Simulator            | 8080          | 8080          | HTTP      |
| Kafka                | 9092          | 9092          | TCP       |
| PostgreSQL           | 5432          | 5432          | TCP       |
| Ingestion Service    | 8000          | —             | HTTP      |
| Processing Service   | 8001          | 8001          | HTTP      |
| Dashboard Service    | 8002          | 8082          | HTTP + WS |
| Frontend (Nginx)     | 80            | 3000          | HTTP + WS |

---

# Data Flow

```
Simulator ──REST/SSE──▶ Ingestion Service ──Kafka(sensor.events)──▶ Processing Service
                                                                        │
                                         ┌──────────────────────────────┘
                                         │
                                         ▼
                          Kafka(sensor.events + actuator.events)
                                         │
                                         ▼
                                  Dashboard Service ──WebSocket──▶ Frontend
                                         ▲
                                         │
                         Frontend ──HTTP /api/*──▶ Dashboard Service ──proxy──▶ Processing Service
                                                                                     │
                                                                                     ▼
                                                                              Simulator (actuators)
                                                                              PostgreSQL (rules)
```

---

# Dependency Versions (Shared Across Services)

| Package    | Version  | Used By                                      |
|------------|----------|----------------------------------------------|
| `fastapi`  | 0.115.6  | All 3 Python services                        |
| `uvicorn`  | 0.34.0   | All 3 Python services                        |
| `aiokafka` | 0.12.0   | All 3 Python services                        |
| `httpx`    | 0.28.1   | All 3 Python services                        |
| `pydantic` | 2.10.5   | All 3 Python services                        |
| `sqlalchemy`| 2.0.36  | Processing Service only                      |
| `asyncpg`  | 0.30.0   | Processing Service only                      |


