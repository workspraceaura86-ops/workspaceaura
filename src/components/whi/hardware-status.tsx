import { metricList, sensorOf, subScore, type SensorReading } from "@/lib/whi";

/**
 * Hardware readout. Written so a real NodeMCU feed can flip `mode` to "live"
 * without any layout change.
 */
export function HardwareStatus({
  reading,
  mode = "simulation",
}: {
  reading: SensorReading;
  mode?: "simulation" | "live";
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="label-eyebrow">Hardware status</span>
        <span className="mono-num flex items-center gap-2 text-[11px] text-muted-foreground">
          <span
            className="h-1.5 w-1.5 animate-breath rounded-full"
            style={{ background: mode === "live" ? "var(--state-excellent)" : "var(--signal)" }}
          />
          {mode === "live" ? "Live hardware connected" : "Simulation mode"}
        </span>
      </div>

      <p className="mt-3 max-w-[62ch] text-xs leading-relaxed text-muted-foreground">
        Only distance and light are measured at your desk. Temperature, humidity and air quality are
        general local readings for your area from the Open-Meteo APIs — not workspace measurements —
        so they are weighted 10% each, while distance carries 70%. Light is displayed for context
        and is excluded from the score.
      </p>

      <ul className="mt-5 divide-y divide-border">
        {metricList.map((m) => {
          const s = subScore(m.key, reading[m.key]);
          return (
            <li key={m.key} className="flex items-center gap-4 py-3">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: "var(--state-excellent)" }}
              />
              <span className="mono-num w-[86px] shrink-0 text-xs text-foreground/90">
                {sensorOf[m.key].part}
              </span>
              <span className="flex-1 text-xs text-muted-foreground">{sensorOf[m.key].name}</span>
              <span
                className="mono-num text-xs"
                style={{
                  color:
                    s > 82
                      ? "var(--state-excellent)"
                      : s > 55
                        ? "var(--state-warn)"
                        : "var(--state-poor)",
                  transition: "color 700ms ease",
                }}
              >
                {m.key === "temperature" ? reading[m.key].toFixed(1) : Math.round(reading[m.key])}
                {m.unit === "%" ? "%" : ` ${m.unit}`}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        WHI measures environment only — viewing distance, light, temperature and humidity. It does
        not observe or infer posture.
      </p>
    </div>
  );
}
