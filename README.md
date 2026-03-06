# Mars Habitat Automation Platform

## Project Overview
This project is a distributed IoT platform designed to manage telemetry, environmental controls, and automation for a simulated Mars Habitat. It utilizes a microservices architecture to ingest sensor data, process automation rules, and provide a real-time monitoring dashboard to operators.

## Current Build Status

**Phase 1: Project Scaffolding & Initialization** - *(Completed)*

### ✅ Completed Milestones
1. **System Architecture Designed**: Full distributed microservices plan established (`PROJECT_PLAN.md`).
2. **Infrastructure Defined**: `docker-compose.yml` mapped out for 7+ services including Kafka, Zookeeper, PostgreSQL, the Simulator, and our custom services.
3. **Microservices Scaffolded (Python 3.12 / FastAPI)**:
   - **`ingestion-service`**: Created normalizers, poller, streamer, and Kafka producer.
   - **`processing-service`**: Created async PostgreSQL database models, automation rule evaluator, and actuator request clients.
   - **`dashboard-service`**: Set up WebSocket manager, Redis cache (planned), and proxy routes.
4. **Frontend Scaffolded (React 18 / Vite)**:
   - Initialized React SPA with Material UI and Recharts.
   - Set up native WebSocket hooks for real-time telemetry updates.
   - Drafted dashboard, actuator panels, and rule management components.
5. **Version Control**: Git repository initialized, branch `daniele` created, and standard `.gitignore` appropriately configured to track code while dropping OCI simulator artifacts and cache files.

### 🚧 Next Immediate Steps
- [ ] Boot the foundational infrastructure (PostgreSQL, Zookeeper, Kafka) via Docker Compose.
- [ ] Load the `mars-iot-simulator` Docker image into the local daemon and run the simulator.
- [ ] Verify `ingestion-service` connects to the simulator correctly (polling or streaming).
- [ ] Spin up the React frontend and `dashboard-service` to visually verify data flow.
- [ ] Run end-to-end testing of an automation rule triggering an actuator.

---
*Generated: March 2026*
