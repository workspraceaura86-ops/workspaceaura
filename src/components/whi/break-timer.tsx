import { useEffect, useRef, useState } from "react";

const REST = 20;

/** 20-20-20 rule, rendered like a device timer rather than a widget. */
export function BreakTimer({
  onBreakComplete,
  focusMinutes = 20,
}: {
  onBreakComplete: () => void;
  /** Focus block length, set by the personalization profile + work style. */
  focusMinutes?: number;
}) {
  const FOCUS = Math.round(focusMinutes * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"focus" | "rest">("focus");
  const [left, setLeft] = useState(FOCUS);

  // A profile change resets the block so the readout never lies.
  useEffect(() => {
    setRunning(false);
    setPhase("focus");
    setLeft(FOCUS);
  }, [FOCUS]);
  const done = useRef(onBreakComplete);
  done.current = onBreakComplete;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((t) => {
        if (t > 1) return t - 1;
        if (phase === "focus") {
          setPhase("rest");
          return REST;
        }
        done.current();
        setPhase("focus");
        return FOCUS;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, FOCUS]);

  const total = phase === "focus" ? FOCUS : REST;
  const progress = 1 - left / total;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="label-eyebrow">20 · 20 · 20</span>
        <span className="text-xs text-muted-foreground">
          {phase === "focus" ? `${focusMinutes}-minute focus block` : "Look 20 feet away"}
        </span>
      </div>

      <div className="mt-6 flex items-end gap-6">
        <span
          className="display-num text-[68px] md:text-[86px]"
          style={{ color: phase === "rest" ? "var(--state-excellent)" : "var(--foreground)", transition: "color 800ms ease" }}
        >
          {mm}:{ss}
        </span>
        <div className="flex gap-5 pb-4">
          <button
            onClick={() => setRunning((r) => !r)}
            className="text-sm text-foreground underline-offset-[6px] transition-colors hover:text-signal hover:underline"
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setPhase("focus");
              setLeft(FOCUS);
            }}
            className="text-sm text-muted-foreground underline-offset-[6px] transition-colors hover:text-foreground hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-6 h-px w-full bg-border">
        <div
          className="h-px"
          style={{
            width: `${progress * 100}%`,
            background: phase === "rest" ? "var(--state-excellent)" : "var(--signal)",
            transition: "width 1000ms linear, background 800ms ease",
          }}
        />
      </div>

      <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        Every twenty minutes, rest your focus on something twenty feet away for twenty seconds. It
        resets the ciliary muscle your screen keeps contracted.
      </p>
    </div>
  );
}
