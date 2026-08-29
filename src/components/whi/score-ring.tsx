import { useEffect, useRef, useState } from "react";

import { useSmoothNumber } from "@/lib/use-smooth-number";
import { statusOf, statusTone } from "@/lib/whi";

/**
 * The score as a machined dial: a thin arc that fills, a large numeral that
 * counts, and a brief warm halo the moment the score improves.
 */
export function ScoreRing({ score, size = 260 }: { score: number; size?: number }) {
  const smooth = useSmoothNumber(score, 0.1);
  const tone = statusTone(statusOf(score));
  const prev = useRef(score);
  const [improving, setImproving] = useState(false);

  useEffect(() => {
    const rising = score > prev.current;
    prev.current = score;
    if (!rising) return undefined;
    setImproving(true);
    const t = setTimeout(() => setImproving(false), 1600);
    return () => clearTimeout(t);
  }, [score]);

  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, smooth)) / 100) * c;

  return (
    <div className="relative" style={{ width: size, maxWidth: "100%" }}>
      <svg viewBox="0 0 120 120" className="block w-full" role="img" aria-label={`Workspace health score ${Math.round(score)} of 100`}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--hairline)" strokeWidth="1.5" />
        {Array.from({ length: 48 }).map((_, i) => {
          const a = (i / 48) * Math.PI * 2 - Math.PI / 2;
          const lit = i / 48 <= smooth / 100;
          return (
            <line
              key={i}
              x1={(60 + Math.cos(a) * 52).toFixed(2)}
              y1={(60 + Math.sin(a) * 52).toFixed(2)}
              x2={(60 + Math.cos(a) * 56).toFixed(2)}
              y2={(60 + Math.sin(a) * 56).toFixed(2)}
              stroke={lit ? tone.color : "var(--hairline)"}
              strokeWidth="1"
              style={{ transition: "stroke 600ms ease" }}
            />
          );
        })}
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={tone.color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(2)} ${(c - dash).toFixed(2)}`}
          transform="rotate(-90 60 60)"
          style={{
            transition: "stroke 900ms ease",
            filter: improving
              ? "drop-shadow(0 0 6px color-mix(in oklab, var(--state-excellent) 60%, transparent))"
              : "none",
          }}
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="display-num text-[54px] md:text-[62px]"
          style={{ color: tone.color, transition: "color 900ms ease" }}
        >
          {Math.round(smooth)}
        </span>
        <span className="mono-num mt-1 text-[10px] tracking-[0.24em] text-muted-foreground">
          /100
        </span>
      </div>
    </div>
  );
}
