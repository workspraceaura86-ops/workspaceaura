import { metrics, type Reasoning, type SensorReading } from "@/lib/whi";

/**
 * The story layer. One large sentence answers "what changed and why",
 * then the contributing channels are listed as plain lines — no cards.
 */
export function Narrative({
  reasoning,
  stamp,
}: {
  reasoning: Reasoning;
  reading: SensorReading;
  stamp: number;
}) {
  const { delta, lines } = reasoning;
  const steady = lines.length === 0;
  const tone = steady
    ? "var(--muted-foreground)"
    : delta < 0
      ? "var(--state-poor)"
      : "var(--state-excellent)";

  return (
    <div key={stamp} className="animate-fade">
      <span className="label-eyebrow">Why it changed</span>

      <h2 className="mt-4 max-w-[22ch] text-[30px] leading-[1.12] text-foreground md:text-[40px]">
        {steady ? (
          <>Your workspace is holding steady.</>
        ) : (
          <>
            Your score{" "}
            <span style={{ color: tone, transition: "color 700ms ease" }}>
              {delta < 0 ? "fell" : "rose"} {Math.abs(delta)} point{Math.abs(delta) === 1 ? "" : "s"}
            </span>{" "}
            because your {metrics[lines[0]!.key].label.toLowerCase()} changed.
          </>
        )}
      </h2>

      <div className="mt-8 divide-y divide-border">
        {steady && (
          <p className="py-4 text-sm text-muted-foreground">
            No meaningful environmental movement in the last reading. Adjust a control and the room
            — and this explanation — respond immediately.
          </p>
        )}
        {lines.map((l) => (
          <div key={l.key} className="flex items-start gap-5 py-4">
            <span
              className="mono-num w-14 shrink-0 pt-0.5 text-sm"
              style={{ color: l.direction === "up" ? "var(--state-excellent)" : "var(--state-poor)" }}
            >
              {l.delta > 0 ? "+" : "−"}
              {Math.abs(l.delta).toFixed(1)}
            </span>
            <p className="text-sm leading-relaxed text-foreground/80">{l.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
