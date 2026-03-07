import React from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";

import theme from "./theme";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import Dashboard from "./components/dashboard/Dashboard";
import ActuatorPanel from "./components/actuators/ActuatorPanel";
import RuleManager from "./components/rules/RuleManager";
import EventLog from "./components/events/EventLog";
import LoadingScreen from "./components/loading/LoadingScreen";
import { useState, useEffect} from 'react';



function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Main Layout */}
      <div className="flex min-h-screen bg-background text-white">

        {/* Sidebar */}
        <Sidebar />

        {/* Content */}
        <main className="ml-60 flex flex-col flex-1">



          {/* Page Content */}
          <div className="flex-1 p-6 md:p-8 ">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/actuators" element={<ActuatorPanel />} />
              <Route path="/rules" element={<RuleManager />} />
              <Route path="/events" element={<EventLog />} />
            </Routes>
          </div>

        </main>

      </div>
    </ThemeProvider>
  );
}

export default App;