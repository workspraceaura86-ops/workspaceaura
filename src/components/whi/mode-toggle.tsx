import { Switch } from "@/components/ui/switch";

/** Switches the reading source between live hardware and manual simulation. */
export function ModeToggle({
  simulation,
  onChange,
  liveStatus,
}: {
  simulation: boolean;
  onChange: (v: boolean) => void;
  liveStatus: "idle" | "connecting" | "live" | "error";
}) {
  const dotColor = simulation
    ? "var(--signal)"
    : liveStatus === "live"
      ? "var(--state-excellent)"
      : liveStatus === "error"
        ? "var(--state-poor)"
        : "var(--state-warn)";

  const label = simulation
    ? "Simulation mode · manual controls unlocked"
    : liveStatus === "live"
      ? "Live hardware feed · sensors streaming"
      : liveStatus === "error"
        ? "Live feed unavailable"
        : "Connecting to hardware feed…";

  return (
    <div className="hairline-t flex flex-wrap items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3">
        <span
          className="h-1.5 w-1.5 animate-breath rounded-full"
          style={{ background: dotColor, transition: "background 700ms ease" }}
        />
        <span className="mono-num text-[11px] text-muted-foreground">{label}</span>
      </div>
      <label className="flex cursor-pointer items-center gap-3">
        <span className="label-eyebrow">Simulation mode</span>
        <Switch checked={simulation} onCheckedChange={onChange} aria-label="Simulation mode" />
      </label>
    </div>
  );
}
