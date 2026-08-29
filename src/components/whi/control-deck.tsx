import { Slider } from "@/components/ui/slider";
import { metricList, presets, subScore, zoneOf, type MetricKey, type SensorReading } from "@/lib/whi";

/** The physical control surface of the device: four channels, one row each. */
export function ControlDeck({
  reading,
  onChange,
  onPreset,
}: {
  reading: SensorReading;
  onChange: (key: MetricKey, value: number) => void;
  onPreset: (r: SensorReading) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="label-eyebrow">Environment controls</span>
        <span className="mono-num flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-breath rounded-full bg-signal" />
          Simulated feed · hardware-ready
        </span>
      </div>

      <div className="mt-6 divide-y divide-border">
        {metricList.map((m) => {
          const value = reading[m.key];
          const s = subScore(m.key, value);
          const tone =
            s > 82 ? "var(--state-excellent)" : s > 55 ? "var(--state-warn)" : "var(--state-poor)";
          const lo = ((m.ideal[0] - m.min) / (m.max - m.min)) * 100;
          const hi = ((m.ideal[1] - m.min) / (m.max - m.min)) * 100;

          return (
            <div key={m.key} className="grid grid-cols-1 gap-3 py-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6">
              <div>
                <p className="text-sm text-foreground/90">{m.label}</p>
                <p className="text-xs text-muted-foreground">{zoneOf(m.key, value)}</p>
              </div>

              <div className="flex items-center gap-5">
                <div className="relative flex-1">
                  <div
                    className="pointer-events-none absolute -top-1 h-[3px] rounded-full"
                    style={{
                      left: `${lo}%`,
                      width: `${hi - lo}%`,
                      background: "color-mix(in oklab, var(--state-excellent) 55%, transparent)",
                    }}
                  />
                  <Slider
                    min={m.min}
                    max={m.max}
                    step={m.step}
                    value={[value]}
                    onValueChange={(v) => onChange(m.key, v[0] ?? value)}
                    aria-label={m.label}
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

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="label-eyebrow">Scenarios</span>
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => onPreset(p.reading)}
            className="text-sm text-muted-foreground underline-offset-[6px] transition-colors duration-300 hover:text-signal hover:underline"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
