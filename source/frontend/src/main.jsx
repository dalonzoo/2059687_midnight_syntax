/**
 * main.jsx — React application entry point.
 *
 * Mounts the App component into the DOM and wraps it with
 * BrowserRouter for client-side routing.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
