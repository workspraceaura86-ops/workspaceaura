import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { WorkspaceScene } from "@/components/whi/workspace-scene";
import { useSmoothNumber } from "@/lib/use-smooth-number";
import { useWorkspaceConfig } from "@/lib/workspace-config";
import { healthScore, statusOf, statusTone, type MetricKey, type SensorReading } from "@/lib/whi";

export const Route = createFileRoute("/replay")({
  head: () => ({
    meta: [
      { title: "Workspace Replay — watch a whole working day play back" },
      {
        name: "description",
        content:
          "WHI replays a full session as a story: the moment your viewing distance drifted, the hour the light failed, the break that reset everything — with the room changing as it happened.",
      },
      { property: "og:title", content: "Workspace Replay — WHI" },
      {
        property: "og:description",
        content:
          "Scrub through a recorded day at the desk and watch the environment, the score and the reasoning move together.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReplayPage,
});

type Moment = {
  time: string;
  title: string;
  note: string;
  reading: SensorReading;
  /** The channel that drove this moment, dimmed elsewhere in the scene. */
  focus: MetricKey | null;
};

const session: Moment[] = [
  {
    time: "09:00",
    title: "Session begins",
    note: "You sit down to a cool, bright room. Distance is textbook, light is on the healthy side of comfortable. This is the baseline everything else will be measured against.",
    reading: { distance: 68, light: 420, temperature: 21.5, humidity: 47, aqi: 34 },
    focus: null,
  },
  {
    time: "10:00",
    title: "Excellent conditions hold",
    note: "An hour in and nothing has drifted. The room is doing its job quietly, which is exactly what a good workspace feels like — nothing to notice.",
    reading: { distance: 66, light: 450, temperature: 22, humidity: 46, aqi: 34 },
    focus: null,
  },
  {
    time: "11:15",
    title: "You lean in",
    note: "Dense work pulls you toward the screen. Distance falls to 42 cm and stays there. Your focusing muscle is now holding a contraction it cannot release between blinks.",
    reading: { distance: 42, light: 430, temperature: 22.5, humidity: 45, aqi: 34 },
    focus: "distance",
  },
  {
    time: "12:30",
    title: "The room warms",
    note: "Midday sun on the wall plus a warm machine under the desk. Temperature climbs past 25 °C and humidity drops — the classic early-afternoon slump forming in the data.",
    reading: { distance: 44, light: 610, temperature: 25.6, humidity: 36, aqi: 34 },
    focus: "temperature",
  },
  {
    time: "13:10",
    title: "Break taken",
    note: "You stand up, look out of the window, and come back. Viewing distance resets and the score recovers most of what the close positioning had cost. This is the cheapest point recovery in the whole day.",
    reading: { distance: 64, light: 520, temperature: 25.1, humidity: 38, aqi: 34 },
    focus: "distance",
  },
  {
    time: "15:40",
    title: "The light fails",
    note: "The sun leaves the window and nobody turns the lamp on. Ambient light collapses to 90 lux against a bright display — the single hardest thing you can ask a pupil to do.",
    reading: { distance: 58, light: 90, temperature: 23.4, humidity: 41, aqi: 34 },
    focus: "light",
  },
  {
    time: "16:00",
    title: "Lighting recovery",
    note: "The desk lamp comes on and the room lifts back into the healthy band. The score rebounds within a single reading cycle — the environment responds faster than you do.",
    reading: { distance: 60, light: 390, temperature: 23, humidity: 42, aqi: 34 },
    focus: "light",
  },
  {
    time: "17:30",
    title: "Session ends",
    note: "You finish the day at good distance in a well-lit, slightly dry room. Two dips, both environmental, both fixable — and both explained at the moment they happened.",
    reading: { distance: 65, light: 360, temperature: 22.6, humidity: 40, aqi: 34 },
    focus: null,
  },
];

const STEP_MS = 4200;

function ReplayPage() {
  const { setup } = useWorkspaceConfig();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((n) => {
        if (n >= session.length - 1) {
          setPlaying(false);
          return n;
        }
        return n + 1;
      });
    }, STEP_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing]);

  const moment = session[i]!;
  const score = healthScore(moment.reading);
  const smooth = useSmoothNumber(score, 0.08);
  const tone = statusTone(statusOf(score));

  const prevScore = i > 0 ? healthScore(session[i - 1]!.reading) : score;
  const delta = score - prevScore;

  const scores = useMemo(() => session.map((m) => healthScore(m.reading)), []);
  const best = Math.max(...scores);
  const worst = Math.min(...scores);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return (
    <main className="bg-deep pt-28 md:pt-32">
      <section className="mx-auto max-w-[1240px] px-6 md:px-10">
        <span className="label-eyebrow">Workspace replay</span>
        <h1 className="mt-4 max-w-[16ch] text-[42px] leading-[1.0] md:text-[76px]">
          Watch yesterday happen again.
        </h1>
        <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
          A working day is not a chart. It is a sequence of moments where the room changed and you
          adapted without noticing. Press play and watch the desk move through it.
        </p>
      </section>

      {/* The stage */}
      <section className="mx-auto mt-14 max-w-[1240px] px-6 md:px-10">
        <div className="relative overflow-hidden rounded-[28px]">
          <WorkspaceScene
            reading={moment.reading}
            focus={moment.focus}
            setup={setup}
            showReadouts={false}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6 md:p-8">
            <div>
              <span className="mono-num text-[13px] tracking-[0.2em] text-foreground/80">
                {moment.time}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">Recorded session · 09:00–17:30</p>
            </div>
            <div className="text-right">
              <span
                className="display-num text-[54px] leading-none md:text-[72px]"
                style={{ color: tone.color, transition: "color 900ms ease" }}
              >
                {Math.round(smooth)}
              </span>
              <p className="mono-num mt-1 text-xs text-muted-foreground">
                {delta === 0 ? "steady" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} pts`}
              </p>
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="mt-6 flex items-center gap-6">
          <button
            onClick={() => {
              if (i >= session.length - 1) setI(0);
              setPlaying((p) => !p);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-signal hover:text-signal"
            aria-label={playing ? "Pause replay" : "Play replay"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setI(0);
            }}
            className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart
          </button>

          {/* scrub rail */}
          <div className="relative flex-1">
            <div className="h-px w-full bg-border" />
            <div
              className="absolute top-0 h-px bg-signal transition-all duration-700"
              style={{ width: `${(i / (session.length - 1)) * 100}%` }}
            />
            <div className="absolute -top-2 left-0 flex w-full justify-between">
              {session.map((m, n) => (
                <button
                  key={m.time}
                  onClick={() => {
                    setPlaying(false);
                    setI(n);
                  }}
                  className="h-4 w-4 -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                  aria-label={`Jump to ${m.time}`}
                >
                  <span
                    className="mx-auto block h-1.5 w-1.5 rounded-full transition-all duration-500"
                    style={{
                      background: n <= i ? "var(--signal)" : "var(--border)",
                      transform: n === i ? "scale(1.8)" : "scale(1)",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The moment, in words */}
      <section className="mx-auto mt-20 max-w-[1240px] px-6 md:px-10">
        <div className="hairline-t grid gap-12 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-24">
          <div key={i} className="animate-fade">
            <span className="label-eyebrow">{moment.time} · what happened</span>
            <h2 className="mt-4 max-w-[20ch] text-[30px] leading-[1.12] md:text-[44px]">
              {moment.title}
            </h2>
            <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
              {moment.note}
            </p>
          </div>

          {/* the whole day as a timeline of lines, not cards */}
          <ol className="divide-y divide-border">
            {session.map((m, n) => {
              const s = scores[n]!;
              const active = n === i;
              return (
                <li key={m.time}>
                  <button
                    onClick={() => {
                      setPlaying(false);
                      setI(n);
                    }}
                    className="grid w-full grid-cols-[56px_1fr_44px] items-baseline gap-x-4 py-4 text-left"
                  >
                    <span
                      className="mono-num text-xs transition-colors duration-500"
                      style={{ color: active ? "var(--signal)" : "var(--muted-foreground)" }}
                    >
                      {m.time}
                    </span>
                    <span
                      className="text-sm transition-colors duration-500"
                      style={{ color: active ? "var(--foreground)" : "var(--muted-foreground)" }}
                    >
                      {m.title}
                    </span>
                    <span
                      className="mono-num text-right text-sm"
                      style={{ color: statusTone(statusOf(s)).color }}
                    >
                      {s}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Session summary — plain figures, no dashboard */}
      <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
        <div className="hairline-t pt-12">
          <span className="label-eyebrow">What the day added up to</span>
          <div className="mt-8 grid gap-x-16 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Average score", String(avg), "across 8h 30m at the desk"],
              ["Best moment", String(best), "mid-morning, everything in band"],
              ["Worst moment", String(worst), "late afternoon, light collapse"],
              ["Recoveries", "2", "one break, one lamp switched on"],
            ].map(([label, value, note]) => (
              <div key={label}>
                <span className="label-eyebrow">{label}</span>
                <p className="display-num mt-3 text-[52px] leading-none text-foreground">{value}</p>
                <p className="mt-3 max-w-[26ch] text-xs text-muted-foreground">{note}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 max-w-[58ch] text-[17px] leading-relaxed text-foreground/90">
            Both dips came from the room, not from you. That is the point of the replay: habits are
            easier to change once you can see the exact moment they cost you something.
          </p>
        </div>
      </section>

      <footer className="mx-auto mt-24 max-w-[1240px] px-6 pb-16 md:px-10">
        <div className="hairline-t pt-6 text-xs text-muted-foreground">
          Replay shown with a representative recorded session. Live sessions use the same reading
          stream as the hardware pipeline.
        </div>
      </footer>
    </main>
  );
}
