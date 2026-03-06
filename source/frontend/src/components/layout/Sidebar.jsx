/**
 * Sidebar.jsx — Navigation sidebar component.
 *
 * Provides links to the main sections: Dashboard, Actuators, Rules, Events.
 */
import { useLocation, useNavigate } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import RuleIcon from "@mui/icons-material/Rule";
import EventNoteIcon from "@mui/icons-material/EventNote";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: <DashboardIcon fontSize="small" /> },
  { path: "/actuators", label: "Actuators", icon: <ToggleOnIcon fontSize="small" /> },
  { path: "/rules", label: "Rules", icon: <RuleIcon fontSize="small" /> },
  { path: "/events", label: "Events", icon: <EventNoteIcon fontSize="small" /> },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card text-foreground">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">🔴 Mars Habitat</h1>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;