input.md describes the system overview, the user stories, the standard event schema and the rule model


## System overview

Initial draft of user stories:

Given that "I" am the only habitat operator, all user stories are referred to what "I", the operator, the only user think is needed

### USER STORIES

1) As a user, I want to be able to see the data from all sensors in an ordered page
2) As a user, I want to see the newest data possible from the telemetry sensors
3) As a user, I want to see which automation rules are currently active
4) As a user, I want to be able to override the automation rules manually
5) As a user, I want to see an alert if the status for a sensor reaches a critical value
6) As a user, I want to see graphs that show how the telemetry data evolves
7) As a user, I want to monitor the greenhouse temperature and the hydroponic ph to ensure survival of the crops.
8) As a user, I want the platform to automatically update when an actuator state changes so I don’t have to refresh the page 
9) As a user, I want to know when the data was produced for all sensors
10) As a user, I want the data from all the sensors to be coherent and to have a clear unit of measurement
11) As a user, I want to see the status of the connection to the simulator, to ensure I’m receiving data correctly
12) As a user, I want the system to automatically discover new sensors and telemetry topics from the simulator so I don't have to hardcode new hardware
13) As a user, I want automation rules to survive a system restart and not to have to set everything up again
14) As a user, I want to compare the power consumption and the power bus to make sure the habitat is not in a power deficit.
15) As a user, I want to be alerted if there is a power deficit


## Standard event schema

All sensor data — regardless of whether it comes from REST polling or telemetry SSE streams — is normalized into a single **UnifiedEvent** format before being published to Kafka. This is the core data contract of the platform.

### Measurement

| Field    | Type   | Description                                  | Example          |
|----------|--------|----------------------------------------------|------------------|
| `metric` | string | Name of the measurement                      | `"temperature_c"` |
| `value`  | float  | Numeric value of the reading                 | `25.43`          |
| `unit`   | string | Unit of measurement                          | `"°C"`           |

### UnifiedEvent

| Field           | Type               | Description                                                                 | Example                              |
|-----------------|--------------------|-----------------------------------------------------------------------------|--------------------------------------|
| `event_id`      | string (UUID v4)   | Unique identifier for this event                                            | `"a3f1c2e4-..."`                     |
| `source_type`   | string             | Origin type — `"rest"` for polled sensors, `"telemetry"` for streamed topics | `"telemetry"`                        |
| `sensor_id`     | string             | Logical sensor identifier                                                   | `"greenhouse_temperature"`           |
| `schema_family` | string             | Original schema type used during normalization                              | `"rest.scalar.v1"`, `"topic.power.v1"` |
| `timestamp`     | string (ISO 8601)  | Datetime string from the source data                                        | `"2026-03-07T09:24:44.983Z"`        |
| `measurements`  | List\<Measurement\> | List of metric readings extracted from the raw payload                       | See above                            |
| `status`        | string             | Sensor status — `"ok"` or `"warning"`                                       | `"ok"`                               |
| `raw_topic`     | string \| null     | Original telemetry topic name (null for REST sensors)                       | `"mars/telemetry/power_bus"`         |
| `metadata`      | object             | Optional additional data from the source                                    | `{}`                                 |

### Example UnifiedEvent (JSON)

```json
{
  "event_id": "edc005c3-4957-4384-aa28-55b2641abe74",
  "source_type": "telemetry",
  "sensor_id": "power_bus",
  "schema_family": "topic.power.v1",
  "timestamp": "2026-03-07T09:24:44.983121+00:00",
  "measurements": [
    { "metric": "power_kw", "value": 43.36, "unit": "kW" },
    { "metric": "voltage_v", "value": 404.47, "unit": "V" },
    { "metric": "current_a", "value": 107.2, "unit": "A" },
    { "metric": "cumulative_kwh", "value": 16325.204, "unit": "kWh" }
  ],
  "status": "ok",
  "raw_topic": "mars/telemetry/power_bus",
  "metadata": {}
}
```


## Rule model

Automation rules follow an **IF-THEN** pattern: _"IF a sensor metric meets a condition, THEN set an actuator to a target state."_

Rules are persisted in PostgreSQL and survive service restarts. The rule engine evaluates every incoming sensor event against all enabled rules.

### AutomationRule (Database Schema)

| Field            | Type      | Description                                 | Example                    |
|------------------|-----------|---------------------------------------------|----------------------------|
| `id`             | integer   | Auto-incrementing primary key               | `1`                        |
| `sensor_name`    | string    | Sensor to monitor (indexed)                 | `"greenhouse_temperature"` |
| `metric`         | string    | Which measurement to compare                | `"temperature_c"`          |
| `operator`       | string    | Comparison operator: `<`, `<=`, `=`, `>`, `>=` | `">"`                   |
| `threshold`      | float     | Value to compare against                    | `28.0`                     |
| `unit`           | string    | Unit of measurement (informational)         | `"°C"`                     |
| `actuator_name`  | string    | Target actuator to control                  | `"cooling_fan"`            |
| `actuator_state` | string    | Desired state when condition is met         | `"ON"`                     |
| `enabled`        | boolean   | Whether the rule is active (indexed)        | `true`                     |
| `created_at`     | timestamp | When the rule was created                   | `"2026-03-06T12:35:23Z"`  |
| `updated_at`     | timestamp | When the rule was last modified             | `"2026-03-06T12:35:23Z"`  |

### Supported Operators

| Operator | Meaning                  |
|----------|--------------------------|
| `<`      | Less than                |
| `<=`     | Less than or equal to    |
| `=`      | Equal to                 |
| `>`      | Greater than             |
| `>=`     | Greater than or equal to |

### Rule Evaluation Logic

For each incoming `UnifiedEvent`:
1. Find all enabled rules where `rule.sensor_name == event.sensor_id`
2. Find the measurement in `event.measurements` where `measurement.metric == rule.metric`
3. Compare `measurement.value` against `rule.threshold` using `rule.operator`
4. If the condition is true, send a POST request to the simulator to set `rule.actuator_name` to `rule.actuator_state`

### Example Rule

**Natural language:** _"IF greenhouse temperature exceeds 20°C, THEN turn the cooling fan ON."_

```json
{
  "id": 1,
  "sensor_name": "greenhouse_temperature",
  "metric": "temperature_c",
  "operator": ">",
  "threshold": 20.0,
  "unit": "°C",
  "actuator_name": "cooling_fan",
  "actuator_state": "ON",
  "enabled": true,
  "created_at": "2026-03-06T12:35:23.886870",
  "updated_at": "2026-03-06T12:35:23.886870"
}
```

### REST API for Rules

| Method   | Endpoint          | Description          |
|----------|-------------------|----------------------|
| `GET`    | `/api/rules`      | List all rules       |
| `POST`   | `/api/rules`      | Create a new rule    |
| `PUT`    | `/api/rules/{id}` | Update an existing rule (partial update supported) |
| `DELETE` | `/api/rules/{id}` | Delete a rule        |
