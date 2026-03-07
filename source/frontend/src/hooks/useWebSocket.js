import { useEffect, useState } from "react";

const MAX_RECONNECT_DELAY = 30000;
const INITIAL_DELAY = 1000;
const PING_INTERVAL = 25000;

function getWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

let globalWs = null;
let globalIsConnected = false;
let globalLastMessage = null;
let reconnectDelay = INITIAL_DELAY;
let reconnectTimer = null;
let pingTimer = null;

const listeners = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function cleanupTimers() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
}

function startPing() {
  cleanupTimers();

  pingTimer = setInterval(() => {
    if (globalWs?.readyState === WebSocket.OPEN) {
      globalWs.send("ping");
    }
  }, PING_INTERVAL);
}

function connectWebSocket() {
  if (
    globalWs &&
    (globalWs.readyState === WebSocket.OPEN ||
      globalWs.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  const ws = new WebSocket(getWsUrl());
  globalWs = ws;

  ws.onopen = () => {
    globalIsConnected = true;
    reconnectDelay = INITIAL_DELAY;
    notifyListeners();
    startPing();
  };

  ws.onmessage = (event) => {
    try {
      globalLastMessage = JSON.parse(event.data);
      notifyListeners();
    } catch (error) {
      console.warn("Invalid WS message:", event.data);
    }
  };

  ws.onclose = () => {
    globalIsConnected = false;
    globalWs = null;
    notifyListeners();
    cleanupTimers();

    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
      connectWebSocket();
    }, reconnectDelay);
  };

  ws.onerror = () => {
    ws.close();
  };
}

function useWebSocket() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    connectWebSocket();

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    lastMessage: globalLastMessage,
    isConnected: globalIsConnected,
  };
}

export default useWebSocket;