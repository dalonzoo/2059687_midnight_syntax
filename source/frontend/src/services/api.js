/**
 * api.js — Axios HTTP client configured for the Mars Habitat API.
 *
 * All API calls from the frontend go through this client, which targets
 * the same origin (Nginx proxies /api → dashboard-service).
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '', // Same origin — Nginx proxies /api to dashboard-service
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export default api;
