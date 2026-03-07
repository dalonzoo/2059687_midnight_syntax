/**
 * Header.jsx — Top application bar.
 *
 * Displays the page title and a WebSocket connection status indicator.
 */
import useWebSocket from "../../hooks/useWebSocket";
import { Circle, Radio, Activity } from "lucide-react";

function Header() {
  const { isConnected } = useWebSocket();

  return (
    <header className="w-full border-b border-border bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between px-8 py-5">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span>Operations Console</span>
          </div>

          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            Mars Habitat Environmental Control System
          </h1>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            isConnected
              ? "border-emerald-500/30 bg-success text-emerald-100"
              : "border-red-500/30 bg-warning text-red-200"
          }`}
        >
          {isConnected ? (
            <Radio className="h-3.5 w-3.5" />
          ) : (
            <Circle className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
          )}
          <span>{isConnected ? "Live" : "Disconnected"}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;