import type { Recommendation } from "@/lib/whi";

/** Ranked guidance as an editorial list — numbered, quiet, no card chrome. */
export function Guidance({ items, note, stamp = 0 }: { items: Recommendation[]; note?: string; stamp?: number }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="label-eyebrow">What to do next</span>
        <span className="text-xs text-muted-foreground">
          Ranked by points recoverable · each line traced to its sensor
        </span>
      </div>


      {note && (
        <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-signal/90">{note}</p>
      )}

      <ol key={stamp} className="mt-6 divide-y divide-border">
        {items.map((r, i) => {
          const tone =
            r.severity === "critical"
              ? "var(--state-poor)"
              : r.severity === "warning"
                ? "var(--state-warn)"
                : "var(--state-excellent)";
          return (
            <li
              key={r.id}
              className="animate-rise grid grid-cols-[28px_1fr_auto] items-start gap-x-5 gap-y-2 py-6"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="mono-num pt-1 text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: tone, transition: "background 700ms ease" }}
                  />
                  <h3 className="text-[17px] text-foreground">{r.title}</h3>
                </div>
                <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                  {r.body}
                </p>
                <p className="mono-num mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  Source · {r.sensor}
                </p>
              </div>
              <span className="mono-num pt-1 text-sm" style={{ color: r.impact > 0 ? tone : "var(--muted-foreground)" }}>
                {r.impact > 0 ? `+${r.impact}` : "—"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
