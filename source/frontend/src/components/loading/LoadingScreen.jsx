import { Wifi } from "lucide-react";
import marsPerson from "../../assets/marsP.json";
import Lottie from "lottie-react";


function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* soft background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sub/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-2xl" />
      </div>

      <div className="relative flex flex-col items-center justify-center gap-8 px-6 text-center">
        {/* animated loader */}
        <div className="relative flex h-40 w-40 items-center justify-center">
          {/* outer orbit ring */}
          <div className="absolute h-40 w-40 animate-spin rounded-full border border-white/10" />

          {/* middle orbit ring */}
          <div className="absolute h-28 w-28 animate-[spin_8s_linear_infinite] rounded-full border border-warning/30" />

          {/* orbiting dot 1 */}
          <div className="absolute h-40 w-40 animate-spin">
            <div className="absolute left-1/2 top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-warning shadow-[0_0_20px_hsl(var(--warning))]" />
          </div>

          {/* orbiting dot 2 reverse feel */}
          <div className="absolute h-28 w-28 animate-[spin_5s_linear_infinite_reverse]">
            <div className="absolute left-1/2 top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-success shadow-[0_0_16px_hsl(var(--success))]" />
          </div>

          {/* center core */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-card shadow-[0_0_40px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 animate-pulse rounded-full bg-sub/30 blur-md" />
            <div className="relative flex items-center justify-center rounded-full bg-primary p-2">
              <Lottie
              animationData={marsPerson}
              loop={true}
              autoplay={true}
            />
            </div>
          </div>

          {/* pulsing signal icon */}
          <div className="absolute -bottom-2 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-success/30 bg-card">
            <Wifi className="h-5 w-5 animate-pulse text-success" />
          </div>
        </div>

        {/* text */}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-wide text-white md:text-4xl">
            Mars Habitat Control
          </h1>

          <p className="text-sm text-muted-foreground md:text-base">
            Initializing monitoring systems...
          </p>

          {/* animated loading bars */}
          <div className="mx-auto mt-4 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-warning [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-white/80 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-success" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;