import { useLocation, useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import RuleIcon from "@mui/icons-material/Rule";
import EventNoteIcon from "@mui/icons-material/EventNote";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import Lottie from "lottie-react";
import marsAnimation from "../../assets/mars.json";

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
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-border bg-background text-foreground opacity-0 animate-fade-in-delay-1">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
            <RocketLaunchIcon className="text-sub" fontSize="small" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
              Mars Habitat
            </h1>
            <p className="text-xs text-muted-foreground">
              Control Platform
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <p className="mb-10 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Navigation
        </p>
      </div>

      <nav className="px-3">
        <ul className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colots duration-500 ${
                    isActive
                      ? "border border-primary/25 bg-primary/30 shadow-sm"
                      : "border border-transparent hover:border-border hover:bg-card"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary/15 text-sub"
                        : "bg-transparent text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <div className="flex min-w-0 flex-1 items-center justify-between">
                    <span
                      className={`truncate text-md font-medium ${
                        isActive ? "text-sub" : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>

                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex-1 px-4 py-6">
        <div className="flex h-full items-center justify-center">
          <div className="w-full opacity-90">
            <Lottie
              animationData={marsAnimation}
              loop={true}
              autoplay={true}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sub" />
            <p className="text-xs font-semibold text-foreground">
              Habitat Status
            </p>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Monitoring sensors, rules, and actuator activity from a unified
            control panel.
          </p>
        </div>
      </div>
    </aside>

  );
}

export default Sidebar;