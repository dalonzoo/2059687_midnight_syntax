import { useState, useEffect, useRef, useCallback } from "react";
import useWebSocket from "./useWebSocket";
import api from "../services/api";

const MAX_HISTORY = 100;
const MAX_ACTUATOR_EVENTS = 200;

function useSensorData() {
  const { lastMessage } = useWebSocket();

  const [sensors, setSensors] = useState({});
  const [history, setHistory] = useState({});
  const [actuatorEvents, setActuatorEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const lastProcessed = useRef(null);

  const fetchInitialState = useCallback(async () => {
    try {
      const res = await api.get("/api/state");
      const initialSensors = res.data?.sensors || {};

      setSensors(initialSensors);

      const initialHistory = {};
      Object.entries(initialSensors).forEach(([sensorId, event]) => {
        initialHistory[sensorId] = [event];
      });
      setHistory(initialHistory);
    } catch (error) {
      console.error("Failed to fetch initial sensor state:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialState();
  }, [fetchInitialState]);

  useEffect(() => {
    if (!lastMessage || lastMessage === lastProcessed.current) return;
    lastProcessed.current = lastMessage;

    if (lastMessage.type === "sensor_update") {
      const event = lastMessage.data;
      const sensorId = event.sensor_id;

      setSensors((prev) => ({
        ...prev,
        [sensorId]: event,
      }));

      setHistory((prev) => ({
        ...prev,
        [sensorId]: [
          ...(prev[sensorId] || []).slice(-(MAX_HISTORY - 1)),
          event,
        ],
      }));
    }

    if (lastMessage.type === "actuator_update") {
      setActuatorEvents((prev) => [
        ...prev.slice(-(MAX_ACTUATOR_EVENTS - 1)),
        lastMessage.data,
      ]);
    }
  }, [lastMessage]);

  return {
    sensors,
    history,
    actuatorEvents,
    loading,
  };
}

export default useSensorData;