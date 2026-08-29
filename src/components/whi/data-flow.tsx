import { useEffect, useRef, useState } from "react";

const STAGES = ["Sensor", "NodeMCU", "Cloud", "Workspace Aura"] as const;

/**
 * The IoT pipeline, drawn as a physical bus. When a reading changes, a light
 * pulse travels Sensor -> NodeMCU -> Cloud -> Aura, arriving just before the
 * dashboard commits the new value.
 */
export function DataFlow({ stamp, label }: { stamp: number; label?: string }) {
  const [live, setLive] = useState(false);
  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setLive(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLive(false), 1400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [stamp]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label-eyebrow">Signal path</span>
        <span
          className="mono-num text-[11px]"
          style={{
            color: live ? "var(--signal)" : "var(--muted-foreground)",
            transition: "color 400ms ease",
          }}
        >
          {live ? (label ?? "transmitting…") : "idle · 3 s sampling"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] items-center gap-x-2 sm:gap-x-3">
        {STAGES.map((s, i) => (
          <Segment key={s} name={s} index={i} live={live} last={i === STAGES.length - 1} />
        ))}
      </div>
    </div>
  );
}

function Segment({
  name,
  index,
  live,
  last,
}: {
  name: string;
  index: number;
  live: boolean;
  last: boolean;
}) {
  const delay = index * 320;
  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background: live ? "var(--signal)" : "var(--hairline)",
            boxShadow: live ? "0 0 0 4px color-mix(in oklab, var(--signal) 18%, transparent)" : "none",
            transition: "background 300ms ease, box-shadow 300ms ease",
            transitionDelay: `${delay}ms`,
          }}
        />
        <span className="whitespace-nowrap text-[10px] text-muted-foreground sm:text-[11px]">
          {name}
        </span>
      </div>
      {!last && (
        <div className="relative -mt-4 h-px w-full bg-border">
          <span
            className="absolute inset-y-0 left-0 block h-px"
            style={{
              width: live ? "100%" : "0%",
              background: "var(--signal)",
              transition: `width 320ms linear ${delay}ms, opacity 500ms ease ${delay + 900}ms`,
              opacity: live ? 1 : 0,
            }}
          />
        </div>
      )}
    </>
  );
}
