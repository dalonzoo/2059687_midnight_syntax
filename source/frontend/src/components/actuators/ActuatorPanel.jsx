import { useState, useEffect, useCallback } from "react";
import ActuatorCard from "./ActuatorCard";
import api from "../../services/api";
import useWebSocket from "../../hooks/useWebSocket";

function ActuatorPanel() {
  const [actuators, setActuators] = useState({});
  const { lastMessage } = useWebSocket();

  const fetchActuators = useCallback(async () => {
    try {
      const res = await api.get("/api/actuators");
      setActuators(res.data.actuators || {});
    } catch (err) {
      console.error("Failed to fetch actuators:", err);
    }
  }, []);

  useEffect(() => {
    fetchActuators();
  }, [fetchActuators]);

  useEffect(() => {
    if (lastMessage?.type !== "actuator_update") return;

    const event = lastMessage.data;

    if (!event?.actuator_name || !event?.state) return;

    setActuators((prev) => ({
      ...prev,
      [event.actuator_name]: event.state,
    }));
  }, [lastMessage]);

  const handleToggle = async (name, currentState) => {
    const newState = currentState === "ON" ? "OFF" : "ON";

    try {
      await api.post(`/api/actuators/${name}`, { state: newState });

      setActuators((prev) => ({
        ...prev,
        [name]: newState,
      }));
    } catch (err) {
      console.error(`Failed to toggle ${name}:`, err);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-white">Actuator Control</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 opacity-0 animate-fade-in-delay-1">
        {Object.entries(actuators).map(([name, state]) => (
          <ActuatorCard
            key={name}
            name={name}
            state={state}
            onToggle={() => handleToggle(name, state)}
          />
        ))}
      </div>
    </div>
  );
}

export default ActuatorPanel;