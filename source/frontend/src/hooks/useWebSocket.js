/**
 * useWebSocket.js — Custom hook for persistent WebSocket connection.
 *
 * Connects to the dashboard-service WebSocket endpoint and provides
 * the latest received message + connection status. Implements auto-reconnect
 * with exponential backoff.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/** Maximum reconnect delay (ms). */
const MAX_RECONNECT_DELAY = 30000;

/** Initial reconnect delay (ms). */
const INITIAL_DELAY = 1000;

/**
 * Determine the WebSocket URL based on the current browser location.
 * In production (Nginx), the WS endpoint is at ws://<host>/ws.
 * During dev, Vite's proxy handles it.
 */
function getWsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

// Singleton state — shared across all hook instances
let globalWs = null;
let globalIsConnected = false;
let globalLastMessage = null;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function connectWebSocket() {
  if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
    return;
  }

  let reconnectDelay = INITIAL_DELAY;

  function doConnect() {
    const ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      globalIsConnected = true;
      reconnectDelay = INITIAL_DELAY;
      notifyListeners();
    };

    ws.onmessage = (event) => {
      try {
        globalLastMessage = JSON.parse(event.data);
        notifyListeners();
      } catch (e) {
        console.warn('Invalid WS message:', event.data);
      }
    };

    ws.onclose = () => {
      globalIsConnected = false;
      globalWs = null;
      notifyListeners();

      // Auto-reconnect with exponential backoff
      setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
        doConnect();
      }, reconnectDelay);
    };

    ws.onerror = () => {
      ws.close();
    };

    globalWs = ws;
  }

  doConnect();
}

/**
 * Hook that provides WebSocket connection status and the last received message.
 *
 * @returns {{ lastMessage: object|null, isConnected: boolean }}
 */
function useWebSocket() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    connectWebSocket(); // Connect on first use
    return () => listeners.delete(listener);
  }, []);

  return {
    lastMessage: globalLastMessage,
    isConnected: globalIsConnected,
  };
}

export default useWebSocket;
