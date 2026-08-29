import { liveChannels, luxFromState, type NodemcuRow } from "@/lib/live-feed";
import { metricList, subScore, zoneOf, type SensorReading } from "@/lib/whi";

/** Read-only replacement for the control deck when the hardware feed is driving. */
export function LiveReadout({
  reading,
  row,
  status,
  error,
  lastUpdate,
}: {
  reading: SensorReading;
  row: NodemcuRow | null;
  status: "idle" | "connecting" | "live" | "error";
  error: string | null;
  lastUpdate: number | null;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="label-eyebrow">Live environment feed</span>
        <span className="mono-num flex items-center gap-2 text-[11px] text-muted-foreground">
          <span
            className="h-1.5 w-1.5 animate-breath rounded-full"
            style={{
              background: status === "live" ? "var(--state-excellent)" : "var(--state-warn)",
            }}
          />
          {status === "live"
            ? `Sample #${row?.id ?? "—"} · ${lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : ""}`
            : status === "error"
              ? "Feed interrupted"
              : "Connecting…"}
        </span>
      </div>

      {status === "error" && error ? (
        <p className="mt-4 text-xs" style={{ color: "var(--state-poor)" }}>
          {error} — turn on simulation mode to explore the model manually.
        </p>
      ) : null}

      <div className="mt-6 divide-y divide-border">
        {metricList.map((m) => {
          const value = reading[m.key];
          const s = subScore(m.key, value);
          const measured = liveChannels[m.key];
          const tone = !measured
            ? "var(--muted-foreground)"
            : s > 82
              ? "var(--state-excellent)"
              : s > 55
                ? "var(--state-warn)"
                : "var(--state-poor)";
          const lo = ((m.ideal[0] - m.min) / (m.max - m.min)) * 100;
          const hi = ((m.ideal[1] - m.min) / (m.max - m.min)) * 100;
          const pos = Math.max(
            0,
            Math.min(100, ((value - m.min) / (m.max - m.min)) * 100),
          );

          return (
            <div
              key={m.key}
              className="grid grid-cols-1 gap-3 py-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6"
            >
              <div>
                <p className="text-sm text-foreground/90">{m.label}</p>
                <p className="text-xs text-muted-foreground">
                  {measured ? zoneOf(m.key, value) : "Not measured by this module"}
                </p>
              </div>

              <div className="flex items-center gap-5">
                <div className="relative h-[3px] flex-1 rounded-full bg-border">
                  <div
                    className="pointer-events-none absolute -top-[3px] h-[3px] rounded-full"
                    style={{
                      left: `${lo}%`,
                      width: `${hi - lo}%`,
                      background: "color-mix(in oklab, var(--state-excellent) 55%, transparent)",
                    }}
                  />
                  <span
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${pos}%`,
                      background: tone,
                      transition: "left 900ms ease, background 700ms ease",
                    }}
                  />
                </div>
                <div className="w-[104px] text-right">
                  <span
                    className="mono-num text-[22px]"
                    style={{ color: tone, transition: "color 700ms ease" }}
                  >
                    {m.key === "temperature" ? value.toFixed(1) : Math.round(value)}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {m.unit === "%" ? "%" : m.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Distance comes straight from the HC-SR04. The LDR reports a two-state reading, mapped to{" "}
        <span className="mono-num">{luxFromState("bright")} lux</span> when bright and{" "}
        <span className="mono-num">{luxFromState("dark")} lux</span> when dark. Temperature and
        humidity are not wired on this module yet, so they hold your profile baseline.
      </p>
    </div>
  );
}
