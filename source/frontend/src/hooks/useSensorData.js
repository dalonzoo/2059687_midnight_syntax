/**
 * useSensorData.js — Custom hook for managing sensor state from WebSocket.
 *
 * Listens to WebSocket messages and maintains:
 *   - sensors: Latest reading per sensor (keyed by sensor_id)
 *   - history: Array of recent readings per sensor (for charting)
 *   - actuatorEvents: List of actuator change events (for event log)
 */
import { useState, useEffect, useRef } from 'react';
import useWebSocket from './useWebSocket';

/** Maximum number of history points to keep per sensor (for charts). */
const MAX_HISTORY = 100;

/** Maximum number of actuator events to keep (for event log). */
const MAX_ACTUATOR_EVENTS = 200;

function useSensorData() {
  const { lastMessage } = useWebSocket();
  const [sensors, setSensors] = useState({});
  const [history, setHistory] = useState({});
  const [actuatorEvents, setActuatorEvents] = useState([]);

  // Use a ref to track the last processed message to avoid duplicate processing
  const lastProcessed = useRef(null);

  useEffect(() => {
    if (!lastMessage || lastMessage === lastProcessed.current) return;
    lastProcessed.current = lastMessage;

    if (lastMessage.type === 'sensor_update') {
      const event = lastMessage.data;
      const sensorId = event.sensor_id;

      // Update latest sensor state
      setSensors((prev) => ({ ...prev, [sensorId]: event }));

      // Append to history (keep last MAX_HISTORY points)
      setHistory((prev) => ({
        ...prev,
        [sensorId]: [...(prev[sensorId] || []).slice(-(MAX_HISTORY - 1)), event],
      }));
    }

    if (lastMessage.type === 'actuator_update') {
      setActuatorEvents((prev) => [
        ...prev.slice(-(MAX_ACTUATOR_EVENTS - 1)),
        lastMessage.data,
      ]);
    }
  }, [lastMessage]);

  return { sensors, history, actuatorEvents };
}

export default useSensorData;
