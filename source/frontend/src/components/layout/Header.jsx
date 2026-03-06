/**
 * Header.jsx — Top application bar.
 *
 * Displays the page title and a WebSocket connection status indicator.
 */

import useWebSocket from '../../hooks/useWebSocket';
import { Circle } from "lucide-react";


function Header() {
  const { isConnected } = useWebSocket();

  return (
    <header className="border-b border-white/10 bg-[#2b2b2b] shadow-sm w-full mt-10">
      <div className="flex items-center justify-between px-8 py-5">
        <h1 className="text-2xl font-semibold text-white">
          Mars Habitat Environmental Control System
        </h1>

        <div
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
            isConnected
              ? "border-emerald-500/40 text-emerald-400"
              : "border-red-500/40 text-red-400"
          }`}
        >
          <Circle
            className="h-3 w-3 fill-current"
            strokeWidth={0}
          />
          <span>{isConnected ? "Live" : "Disconnected"}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
